export const LANGUAGES = [
  { code: 'en', locale: 'en-IN', name: 'English' },
  { code: 'hi', locale: 'hi-IN', name: 'हिन्दी' },
  { code: 'te', locale: 'te-IN', name: 'తెలుగు' },
];

export const translations = {
  subtitle: ['Slide & tap to explore AC problems', 'स्लाइड करें और AC की दिक्कतें देखें', 'స్లైడ్ చేసి AC సమస్యలను చూడండి'],
  home: ['Home', 'घर', 'ఇల్లు'], office: ['Office', 'दफ़्तर', 'ఆఫీస్'],
  split: ['Wall AC (Split)', 'दीवार वाला AC', 'గోడ AC (స్ప్లిట్)'], window: ['Window AC', 'खिड़की वाला AC', 'కిటికీ AC'],
  brand: ['AC brand', 'AC का ब्रांड', 'AC బ్రాండ్'], temperature: ['AC temperature', 'AC का तापमान', 'AC ఉష్ణోగ్రత'],
  roomFeel: ['How does the room feel?', 'कमरा कैसा लग रहा है?', 'గది ఎలా అనిపిస్తోంది?'],
  hot: ['🥵 Too hot', '🥵 बहुत गरम', '🥵 చాలా వేడి'], fine: ['🙂 Fine', '🙂 ठीक', '🙂 బాగుంది'], cold: ['🥶 Too cold', '🥶 बहुत ठंडा', '🥶 చాలా చలి'],
  curtains: ['Curtains', 'पर्दे', 'కర్టెన్లు'], open: ['Open', 'खुले', 'తెరిచి'], closed: ['Closed', 'बंद', 'మూసి'],
  sun: ['☀️ Sunlight', '☀️ धूप', '☀️ ఎండ'], water: ['💧 Water dripping', '💧 पानी टपकना', '💧 నీరు కారడం'],
  dust: ['🌫️ Dirty AC', '🌫️ गंदा AC', '🌫️ మురికి AC'], noise: ['🔊 AC noise', '🔊 AC की आवाज़', '🔊 AC శబ్దం'],
  power: ['⚡ AC power', '⚡ AC की बिजली', '⚡ AC కరెంట్'], relocation: ['📦 Shift / install', '📦 शिफ्ट / इंस्टॉल', '📦 షిఫ్ట్ / ఇన్‌స్టాల్'],
  diagnose: ['Suggest a service', 'सेवा सुझाएँ', 'సేవను సూచించండి'],
  feelHot: ['Room is too hot', 'कमरा बहुत गरम है', 'గది చాలా వేడిగా ఉంది'],
  feelCold: ['Room is too cold', 'कमरा बहुत ठंडा है', 'గది చాలా చల్లగా ఉంది'],
  dustIssue: ['Dust is affecting airflow', 'धूल हवा को रोक रही है', 'దుమ్ము గాలి ప్రవాహాన్ని అడ్డుకుంటోంది'],
  noiseIssue: ['AC is making a loud noise', 'AC से तेज़ आवाज़ आ रही है', 'AC నుండి పెద్ద శబ్దం వస్తోంది'],
  waterIssue: ['Water is leaking', 'पानी टपक रहा है', 'నీరు కారుతోంది'],
  powerIssue: ['AC has no power', 'AC में बिजली नहीं है', 'AC కి కరెంట్ లేదు'],
  relocationIssue: ['AC shifting or installation', 'AC शिफ्ट या इंस्टॉलेशन', 'AC షిఫ్ట్ లేదా ఇన్‌స్టాలేషన్'],
  noIssue: ['Your AC looks fine', 'आपका AC ठीक लग रहा है', 'మీ AC బాగానే ఉంది'],
  inspect: ['Why this service?', 'यह सेवा क्यों?', 'ఈ సేవ ఎందుకు?'],
  recommended: ['Recommended next step', 'सुझाया गया अगला कदम', 'సూచించిన తదుపరి చర్య'],
  readTip: ['Tap an item in the room for details.', 'जानकारी के लिए कमरे में किसी चीज़ को छुएँ।', 'వివరాల కోసం గదిలోని వస్తువును తాకండి.'],
  sunlightLevel: ['Sunlight level', 'धूप का स्तर', 'ఎండ స్థాయి'],
  waterLevel: ['Leak amount', 'रिसाव की मात्रा', 'లీక్ పరిమాణం'],
  dustLevel: ['Dust level', 'धूल का स्तर', 'దుమ్ము స్థాయి'],
  noiseLevel: ['Noise level', 'आवाज़ का स्तर', 'శబ్ద స్థాయి'],
  currentRoom: ['Current room', 'कमरे की स्थिति', 'గది స్థితి'],
  serviceLocation: ['Where do you need service?', 'आपको सेवा कहाँ चाहिए?', 'మీకు సేవ ఎక్కడ కావాలి?'],
  demoInfo: ['Recommendations are demo guidance; a technician confirms the issue and final price.', 'यह सुझाव डेमो के लिए है; तकनीशियन समस्या और अंतिम कीमत की पुष्टि करेगा।', 'ఇవి డెమో సూచనలు మాత్రమే; సమస్య మరియు తుది ధరను టెక్నీషియన్ నిర్ధారిస్తారు.'],
  services: {
    i: {
      title: ['AC Install / Uninstall', 'AC लगवाना / हटवाना', 'AC బిగించడం / తీసివేయడం'],
      description: ['Safe wall mounting and pipe setup with a free gas check.', 'सुरक्षित दीवार फ़िटिंग, पाइप सेटअप और मुफ़्त गैस जाँच।', 'సురక్షిత గోడ ఫిట్టింగ్, పైప్ సెటప్, ఉచిత గ్యాస్ చెక్.'],
      steps: ['Mark and drill', 'Mount the AC', 'Check the gas'],
      why: ['Incorrect fitting can cause leaks or falls. A trained professional can install it safely.', 'गलत फ़िटिंग से लीक या गिरने का ख़तरा हो सकता है। विशेषज्ञ इसे सुरक्षित लगाते हैं।', 'తప్పు ఫిట్టింగ్ వల్ల లీక్ లేదా పడిపోవచ్చు. నిపుణులు సురక్షితంగా బిగిస్తారు.'],
    },
    f: {
      title: ['Deep Clean (Foam Wash)', 'गहरी सफ़ाई (फ़ोम वॉश)', 'లోతైన శుభ్రత (ఫోమ్ వాష్)'],
      description: ['Deep dust wash with a protective cover and a final cooling check.', 'कवर के साथ गहरी धुलाई और अंत में कूलिंग जाँच।', 'కవర్‌తో లోతైన వాష్, చివరగా కూలింగ్ చెక్.'],
      steps: ['Foam spray', 'Jet wash', 'Dry and test'],
      why: ['Dust can block cool airflow and make the AC work harder.', 'धूल ठंडी हवा रोक सकती है और AC को ज़्यादा मेहनत करनी पड़ती है।', 'దుమ్ము చల్లని గాలిని అడ్డుకొని AC ఎక్కువ పని చేసేలా చేస్తుంది.'],
    },
    g: {
      title: ['Cooling Gas Check', 'कूलिंग गैस की जाँच', 'కూలింగ్ గ్యాస్ చెక్'],
      description: ['Pressure check and leak inspection before any gas top-up.', 'गैस भरने से पहले दबाव और लीक की जाँच।', 'గ్యాస్ నింపే ముందు ప్రెషర్, లీక్ చెక్.'],
      steps: ['Check pressure', 'Inspect for leaks', 'Confirm next step'],
      why: ['Low refrigerant can reduce cooling. A technician should confirm a leak before recommending a refill.', 'गैस कम होने से कूलिंग घट सकती है। रीफ़िल से पहले लीक की पुष्टि ज़रूरी है।', 'గ్యాస్ తక్కువైతే కూలింగ్ తగ్గుతుంది. రీఫిల్‌కు ముందు లీక్ నిర్ధారించాలి.'],
    },
    r: {
      title: ['AC Repair & Check', 'AC मरम्मत और जाँच', 'AC రిపేర్ & చెకప్'],
      description: ['Inspect the unit first, then confirm the repair and price.', 'पहले पूरी जाँच, फिर मरम्मत और कीमत की पुष्टि।', 'ముందు పూర్తి చెక్, తర్వాత రిపేర్ మరియు ధర నిర్ధారణ.'],
      steps: ['Find the fault', 'Explain the repair', 'Test the AC'],
      why: ['Dripping, unusual noise, or a power issue can have several causes. An inspection helps identify the right repair.', 'पानी, आवाज़ या बिजली की दिक्कत के कई कारण हो सकते हैं। जाँच से सही मरम्मत तय होगी।', 'నీరు, శబ్దం లేదా కరెంట్ సమస్యలకు అనేక కారణాలు ఉండవచ్చు. చెక్‌తో సరైన రిపేర్ తెలుస్తుంది.'],
    },
  },
};

export function translate(key, lang = 0) {
  const value = translations[key];
  return Array.isArray(value) ? value[lang] || value[0] : key;
}
