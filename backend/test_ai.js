const jwt = require('jsonwebtoken');
const fs = require('fs');
const dotenv = require('dotenv');

dotenv.config({ path: './.env' });

const token = jwt.sign({ id: 'test_user', role: 'USER' }, 'super_secret_jwt_key_that_is_at_least_32_chars_long');

const cases = [
  { language: 'en', symptom: 'My car is leaking green fluid under the engine, but it is still driving fine.' },
  { language: 'ar', symptom: 'سيارتي تسرب سائل أخضر من تحت المحرك، لكنها لا تزال تعمل بشكل جيد.' },
  { language: 'en', symptom: 'I got into a crash on the highway. The front bumper is smashed and the car will not start.' },
  { language: 'ar', symptom: 'تعرضت لحادث على الطريق السريع. المصد الأمامي محطم والسيارة لا تعمل.' },
  { language: 'en', symptom: 'My brakes are making a loud squealing noise when I stop.' },
  { language: 'ar', symptom: 'الفرامل تصدر صوتاً عالياً مزعجاً عندما أتوقف.' },
  { language: 'en', symptom: 'The check engine light came on yesterday. The car drives normally.' },
  { language: 'ar', symptom: 'أضاءت لمبة المحرك أمس. السيارة تسير بشكل طبيعي.' },
  { language: 'en', symptom: 'My car will not start. I hear a clicking sound when I turn the key.' },
  { language: 'ar', symptom: 'سيارتي لا تعمل. أسمع صوت طقطقة عندما أدير المفتاح.' },
  { language: 'en', symptom: 'There is smoke coming from under the hood and it smells sweet.' },
  { language: 'ar', symptom: 'هناك دخان يتصاعد من تحت غطاء المحرك ورائحته حلوة.' },
  { language: 'en', symptom: 'My steering wheel shakes violently when I drive over 60 mph.' },
  { language: 'ar', symptom: 'عجلة القيادة تهتز بعنف عندما أقود بسرعة تزيد عن 60 ميلاً في الساعة.' },
  { language: 'en', symptom: 'The AC is blowing warm air instead of cold.' },
  { language: 'ar', symptom: 'مكيف الهواء ينفث هواءً دافئاً بدلاً من البارد.' },
  { language: 'en', symptom: 'I have a flat tire and no spare. The car cannot be driven.' },
  { language: 'ar', symptom: 'لدي إطار مثقوب ولا يوجد إطار احتياطي. لا يمكن قيادة السيارة.' },
  { language: 'en', symptom: 'The engine temperature gauge is in the red zone.' },
  { language: 'ar', symptom: 'مؤشر درجة حرارة المحرك في المنطقة الحمراء.' },
];

async function runTests() {
  console.log('Starting 20 Case AI Diagnostics Test...');
  let passed = 0;

  for (let i = 0; i < cases.length; i++) {
    const c = cases[i];
    console.log(`\n--- Test Case ${i + 1} (${c.language}) ---`);
    console.log(`Symptom: ${c.symptom}`);
    
    try {
      const response = await fetch('http://localhost:5001/api/gemini/diagnose', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          symptom: c.symptom,
          language: c.language
        })
      });

      const data = await response.json();
      console.log('API Response:', JSON.stringify(data));
      
      console.log(`AI Action: ${data.action}`);
      console.log(`AI Reply: ${data.reply}`);

      if (data.action && data.reply) {
        passed++;
      } else {
        console.log('❌ FAILED: Missing action or reply');
      }

      await new Promise(resolve => setTimeout(resolve, 3000));
    } catch (err) {
      console.log(`❌ ERROR: ${err.message}`);
    }
  }

  console.log(`\n✅ Finished! ${passed}/${cases.length} tests passed successfully.`);
}

runTests();
