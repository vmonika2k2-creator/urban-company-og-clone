"""Vaayu – LiveKit voice agent (local LiveKit server + Groq STT/LLM).

Run:  python agent.py dev      (after `pip install -r requirements.txt` and a .env, see below)
.env: LIVEKIT_URL=ws://localhost:7880  LIVEKIT_API_KEY=devkey  LIVEKIT_API_SECRET=secret
      GROQ_API_KEY=...   (+ your Indic TTS provider key, e.g. SARVAM_API_KEY)
requirements: livekit-agents[groq,silero]  python-dotenv  (+ the Indic TTS plugin you choose)

NOTE: Groq's own TTS covers English and Arabic only, so Hindi/Telugu/Tamil/Malayalam/Kannada
speech needs another TTS provider (see make_tts). STT and LLM stay on Groq.
"""
import asyncio
import json
import logging
import os
from typing import Literal, Optional

from dotenv import load_dotenv
from livekit.agents import Agent, AgentServer, AgentSession, JobContext, RunContext, cli, function_tool, get_job_context
from livekit.plugins import groq, silero

load_dotenv()
log = logging.getLogger("vaayu")
INSTRUCTIONS = open(os.path.join(os.path.dirname(__file__), "vaayu_prompt.txt"), encoding="utf-8").read()

# ---- Catalog: the ONLY source of truth for prices (the LLM never does the arithmetic) ----
FOAM_JET = {1: 599, 2: 1098, 3: 1497, 4: 1796, 5: 2245}  # >5 ACs: 449 each (assumption, confirm)
PRICES = {
    "no_cooling": ("Less Cooling Inspection", 299),
    "power_issue": ("Power Issue Inspection", 299),
    "noise_smell": ("Noise or Smell Inspection", 499),
    "leakage": ("Water Leakage Inspection", 599),
    "gas_refill": ("Gas Refill & Check-Up", 3000),
    "install_split": ("Split AC Installation", 1699),
    "install_window": ("Window AC Installation", 799),
    "uninstall_split": ("Split AC Uninstallation", 649),
    "uninstall_window": ("Window AC Uninstallation", 699),
}


def build_quote(foam_jet: int, **units: int) -> tuple[int, str]:
    total, parts = 0, []
    if foam_jet > 0:
        total += FOAM_JET.get(foam_jet, foam_jet * 449)
        parts.append(f"Foam-Jet AC Service ({foam_jet} AC{'s' if foam_jet > 1 else ''})")
    for key, (name, price) in PRICES.items():
        n = max(0, units.get(key, 0))
        if n:
            total += price * n
            parts.append(name + (f" x{n}" if n > 1 else ""))
    return total, " + ".join(parts)


CODES = {"en": "en-IN", "hi": "hi-IN", "te": "te-IN", "ta": "ta-IN", "ml": "ml-IN", "kn": "kn-IN"}


def make_tts(lang: str = "en"):
    """Groq TTS is English/Arabic only. Pick an Indic-capable provider.
    Option A (all six languages): Sarvam Bulbul via LiveKit's sarvam plugin.
    Option B: ElevenLabs v3 / Cartesia. Verify exact parameter names in the LiveKit docs."""
    from livekit.plugins import sarvam  # pip install livekit-plugins-sarvam
    return sarvam.TTS(target_language_code=CODES[lang])


# Unicode script -> language, so the language locks deterministically on the first utterance
SCRIPTS = [("hi", 0x0900, 0x097F), ("ta", 0x0B80, 0x0BFF), ("te", 0x0C00, 0x0C7F), ("kn", 0x0C80, 0x0CFF), ("ml", 0x0D00, 0x0D7F)]


def detect_script_lang(text: str) -> Optional[str]:
    counts: dict[str, int] = {}
    for ch in text:
        for code, lo, hi in SCRIPTS:
            if lo <= ord(ch) <= hi:
                counts[code] = counts.get(code, 0) + 1
    return max(counts, key=counts.get) if counts else None


class Vaayu(Agent):
    def __init__(self) -> None:
        super().__init__(instructions=INSTRUCTIONS)
        self.lang: Optional[str] = None
        self._first_turn_done = False

    async def _apply_language(self, lang: str) -> None:
        self.lang = lang
        try:
            self.session.tts.update_options(target_language_code=CODES[lang])
        except Exception as e:  # noqa: BLE001  (adjust to your TTS plugin's update API)
            log.warning("could not switch TTS language: %s", e)
        await self._ui("set_language", {"language": lang})

    async def on_user_turn_completed(self, turn_ctx, new_message) -> None:
        """First user message: detect the language from its script, lock it, update the UI tabs."""
        if self._first_turn_done:
            return
        self._first_turn_done = True
        text = (getattr(new_message, "text_content", None) or "").strip()
        lang = detect_script_lang(text)
        try:
            if lang:
                await self._apply_language(lang)
                turn_ctx.add_message(role="system", content=f"The user speaks language code {lang}. Reply only in that language. If it is the language answer to your greeting, now ask them warmly, in that language, to tell you their concern.")
            else:
                turn_ctx.add_message(role="system", content="The user was just asked which language they prefer; their reply names or speaks it. Call set_language with that language (English is en), then in that language ask them warmly to tell you their concern.")
        except Exception as e:  # noqa: BLE001
            log.warning("language hint failed: %s", e)

    async def on_enter(self) -> None:
        self.session.generate_reply(
            instructions="Greet in one short spoken line: say Namaste, Hello and Vanakkam, say you are Vaayu from Urban Company, and ask which language they are comfortable in: English, Hindi, Telugu, Tamil, Malayalam or Kannada. Do not ask about the AC yet."
        )

    async def _ui(self, method: str, payload: dict) -> None:
        """Send a command to the browser UI over LiveKit RPC. Never crash the call if the UI is gone."""
        room = get_job_context().room
        for p in list(room.remote_participants.values()):
            try:
                await room.local_participant.perform_rpc(
                    destination_identity=p.identity, method=method, payload=json.dumps(payload), response_timeout=5.0
                )
            except Exception as e:  # noqa: BLE001
                log.warning("UI rpc %s failed: %s", method, e)

    @function_tool
    async def set_language(self, context: RunContext, language: Literal["en", "hi", "te", "ta", "ml", "kn"]) -> str:
        """Call once right after the user's first message with the language they spoke
        (en, hi, te, ta, ml or kn). Call again only if the user asks to switch language."""
        await self._apply_language(language)
        return "ok"

    @function_tool
    async def reveal_interface(self, context: RunContext) -> str:
        """Call once, together with update_visual_scene, right after you understood the user's main concern
        and explained it in simple words. This makes the interactive room appear on their screen."""
        await self._ui("reveal_interface", {})
        return "ok"

    @function_tool
    async def update_visual_scene(
        self,
        context: RunContext,
        environment: Optional[Literal["home", "desert", "antarctica"]] = None,
        ac_status: Optional[Literal["on", "off", "hidden"]] = None,
        issue: Optional[Literal["none", "dust", "noise"]] = None,
    ) -> str:
        """Silently change the illustrated room on the user's screen. Send only fields that changed.
        desert = room too hot, antarctica = room too cold, home = normal.
        ac_status hidden = AC being shifted or installed. issue noise or dust shows the problem."""
        payload = {k: v for k, v in {"environment": environment, "ac_status": ac_status, "issue": issue}.items() if v}
        await self._ui("update_visual_scene", payload)
        return "ok"

    @function_tool
    async def show_recommendation(
        self,
        context: RunContext,
        why_best: str,
        action_label: str,
        foam_jet_units: int = 0,
        no_cooling_units: int = 0,
        power_issue_units: int = 0,
        noise_smell_units: int = 0,
        leakage_units: int = 0,
        gas_refill_units: int = 0,
        install_split_units: int = 0,
        install_window_units: int = 0,
        uninstall_split_units: int = 0,
        uninstall_window_units: int = 0,
    ) -> str:
        """Show the recommendation card. Pass how many ACs need each service (0 if none), plus one short
        sentence why_best and a short action_label, both in the user's language. The total is calculated
        from the official catalog. Do not speak the total or the service name unless the user asks."""
        total, title = build_quote(
            foam_jet_units,
            no_cooling=no_cooling_units, power_issue=power_issue_units, noise_smell=noise_smell_units,
            leakage=leakage_units, gas_refill=gas_refill_units, install_split=install_split_units,
            install_window=install_window_units, uninstall_split=uninstall_split_units,
            uninstall_window=uninstall_window_units,
        )
        if total == 0:
            return "No service selected. Ask the user which service and how many ACs."
        await self._ui("inspection_start", {"steps": 3})  # UI shows the suspense animation
        await asyncio.sleep(1.0)
        await self._ui("show_recommendation", {"title": title, "estimated_cost": total, "why_best": why_best, "action_label": action_label})
        return "Button shown on screen. Do NOT say the service name or the price. Say warmly that you think you found it and ask them to tap the button."


server = AgentServer()


@server.rtc_session()
async def entrypoint(ctx: JobContext) -> None:
    session = AgentSession(
        vad=silero.VAD.load(),
        stt=groq.STT(model="whisper-large-v3-turbo", detect_language=True),  # verify `detect_language` in your plugin version
        llm=groq.LLM(model="llama-3.3-70b-versatile"),  # try openai/gpt-oss-120b on Groq if Dravidian-language quality is weak
        tts=make_tts("en"),
    )
    await session.start(agent=Vaayu(), room=ctx.room)


if __name__ == "__main__":
    cli.run_app(server)