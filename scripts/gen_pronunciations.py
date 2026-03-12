"""
Genera pronunciaciones fonéticas en español para todas las palabras de lessons.ts
usando Grok para garantizar precisión.
"""
import os
import json
import re
from xai_sdk import Client

client = Client(api_key=os.environ["XAI_API_KEY"])

# Todas las palabras de los 50 niveles (en el mismo orden que lessons.ts)
words = [
    # Nivel 1
    "Hello","Hi","Bye","Goodbye","Yes","No","Please","Thanks","Sorry","Welcome",
    # Nivel 2
    "One","Two","Three","Four","Five","Six","Seven","Eight","Nine","Ten",
    # Nivel 3
    "Red","Blue","Green","Yellow","Orange","Purple","Pink","Black","White","Brown",
    # Nivel 4
    "Dog","Cat","Bird","Fish","Horse","Cow","Pig","Sheep","Duck","Chicken",
    # Nivel 5
    "Mother","Father","Sister","Brother","Baby","Grandmother","Grandfather","Friend","Son","Daughter",
    # Nivel 6
    "Eye","Ear","Nose","Mouth","Hand","Foot","Leg","Arm","Head","Hair",
    # Nivel 7
    "Water","Milk","Bread","Egg","Apple","Rice","Chicken","Soup","Salad","Coffee",
    # Nivel 8
    "House","Room","Kitchen","Bathroom","Window","Table","Chair","Bed","Garden","Door",
    # Nivel 9
    "Shirt","Pants","Shoes","Dress","Hat","Jacket","Socks","Glasses","Belt","Scarf",
    # Nivel 10
    "Sun","Rain","Snow","Wind","Cloud","Hot","Cold","Storm","Rainbow","Fog",
    # Nivel 11
    "Car","Bus","Train","Plane","Bike","Taxi","Ship","Motorcycle","Subway","Helicopter",
    # Nivel 12
    "Doctor","Teacher","Police","Chef","Engineer","Nurse","Lawyer","Pilot","Farmer","Artist",
    # Nivel 13
    "Soccer","Basketball","Swimming","Tennis","Running","Gym","Baseball","Volleyball","Golf","Boxing",
    # Nivel 14
    "Phone","Computer","Internet","Email","App","Password","Screen","Camera","Battery","Wifi",
    # Nivel 15
    "Tree","Flower","River","Mountain","Ocean","Forest","Desert","Beach","Island","Grass",
    # Nivel 16
    "Happy","Sad","Angry","Scared","Excited","Tired","Surprised","Nervous","Proud","Bored",
    # Nivel 17
    "Eat","Drink","Sleep","Walk","Run","Read","Write","Speak","Listen","Watch",
    # Nivel 18
    "Eleven","Twelve","Thirteen","Fourteen","Fifteen","Sixteen","Seventeen","Eighteen","Nineteen","Twenty",
    # Nivel 19
    "Monday","Tuesday","Wednesday","Thursday","Friday","Saturday","Sunday","January","February","December",
    # Nivel 20
    "Big","Small","Fast","Slow","New","Old","Beautiful","Ugly","Strong","Weak",
    # Nivel 21
    "Menu","Order","Waiter","Bill","Tip","Reservation","Delicious","Spicy","Dessert","Fork",
    # Nivel 22
    "Store","Buy","Sell","Price","Cheap","Expensive","Money","Card","Discount","Receipt",
    # Nivel 23
    "Sick","Healthy","Hospital","Pain","Fever","Cough","Headache","Allergy","Exercise","Medicine",
    # Nivel 24
    "School","Class","Homework","Exam","Grade","Library","Pencil","Notebook","University","Diploma",
    # Nivel 25
    "In","On","Under","Next to","Between","Behind","In front of","Above","Near","Far",
    # Nivel 26
    "What","Where","When","Who","Why","How","Which","How much","How many","How long",
    # Nivel 27
    "Think","Feel","Know","Want","Need","Love","Hate","Try","Understand","Remember",
    # Nivel 28
    "Ticket","Passport","Luggage","Flight","Hotel","Destination","Tourist","Guide","Trip","Vacation",
    # Nivel 29
    "Job","Office","Meeting","Boss","Colleague","Salary","Contract","Resume","Interview","Promotion",
    # Nivel 30
    "Good morning","Good night","How are you","I'm fine","See you later","Excuse me","I don't understand","Can you help me","What time is it","Nice to meet you",
    # Nivel 31
    "Invoice","Budget","Deadline","Client","Report","Profit","Strategy","Presentation","Negotiate","Partnership",
    # Nivel 32
    "Boarding pass","Terminal","Gate","Delay","Customs","Check-in","Arrival","Departure","Luggage claim","Security",
    # Nivel 33
    "Reception","Key card","Checkout","Breakfast","Pool","Elevator","Towel","Room service","Concierge","Minibar",
    # Nivel 34
    "I appreciate it","No problem","Of course","It's my pleasure","Congratulations","Best wishes","Take care","Good luck","Happy birthday","Have a good day",
    # Nivel 35
    "Download","Upload","Charger","Update","Search","Account","Notification","Bluetooth","Screenshot","Settings",
    # Nivel 36
    "Cart","Cashier","Aisle","Organic","Frozen","Expiration date","Bag","Coupon","Checkout","Refund",
    # Nivel 37
    "Appointment","Prescription","Symptom","Surgery","Emergency","Pharmacy","Recovery","Diagnosis","Specialist","Insurance",
    # Nivel 38
    "Deposit","Withdrawal","Transfer","Interest rate","Loan","ATM","Balance","Credit card","Currency","Mortgage",
    # Nivel 39
    "Give up","Look up","Turn on","Turn off","Pick up","Find out","Come back","Get up","Run out","Set up",
    # Nivel 40
    "Carry out","Break down","Take off","Put on","Look for","Go on","Show up","Work out","Point out","Call off",
    # Nivel 41
    "Hobby","Concert","Museum","Theater","Festival","Camping","Photography","Cooking","Reading","Gardening",
    # Nivel 42
    "However","Therefore","Although","Moreover","Meanwhile","Furthermore","Otherwise","Instead","As a result","In addition",
    # Nivel 43
    "Climate change","Pollution","Recycle","Renewable","Endangered","Ecosystem","Sustainable","Deforestation","Carbon footprint","Conservation",
    # Nivel 44
    "Break a leg","Hit the nail on the head","Piece of cake","Under the weather","Bite the bullet","Cost an arm and a leg","Spill the beans","Hit the sack","Once in a blue moon","Let the cat out of the bag",
    # Nivel 45
    "Go / Went","Come / Came","See / Saw","Take / Took","Give / Gave","Think / Thought","Buy / Bought","Teach / Taught","Write / Wrote","Make / Made",
    # Nivel 46
    "Speak / Spoke","Run / Ran","Eat / Ate","Drink / Drank","Sleep / Slept","Wear / Wore","Drive / Drove","Fly / Flew","Swim / Swam","Sing / Sang",
    # Nivel 47
    "Present simple","Past simple","Future simple","Present continuous","Past continuous","Present perfect","Past perfect","Conditional","Imperative","Passive voice",
    # Nivel 48
    "In my opinion","To be honest","As far as I know","I was wondering","It depends on","On the other hand","I'm not sure about","What do you think","I couldn't agree more","That's a good point",
    # Nivel 49
    "Thanksgiving","Halloween","Yard sale","Potluck","Tailgate","Brunch","Commute","Neighborhood","Barbecue","Tip",
    # Nivel 50
    "Negotiate","Collaborate","Implement","Evaluate","Facilitate","Prioritize","Streamline","Benchmark","Stakeholder","Leverage",
]

print(f"Total palabras: {len(words)}")

BATCH_SIZE = 50
all_pronunciations = {}

for i in range(0, len(words), BATCH_SIZE):
    batch = words[i:i+BATCH_SIZE]
    batch_str = "\n".join(f"- {w}" for w in batch)

    prompt = f"""Eres un experto en pronunciación del inglés americano para hispanohablantes latinoamericanos.
Para cada palabra o frase, da una guía de pronunciación SIMPLE usando letras del español.

REGLAS:
1. Usa solo letras que un hispanohablante lea naturalmente
2. Sonido "th" suave (the, this, that): usa "d"
3. Sonido "th" fuerte (think, three, thanks): usa "z"
4. Sonido "sh" (she, shop, fish): usa "sh"
5. Sonido "ch" (chair, church, watch): usa "ch"
6. Sonido "j/dj" (job, judge, gym): usa "dch"
7. Sonido "w": usa "u" antes de vocal (water=UO-ter) o "w" (wifi=UAI-fai)
8. Sonido "v": usa "v"
9. Sonido vocal larga "ee": usa "ii" (three=ZRII, green=GRIIN)
10. Sonido vocal larga "oo": usa "uu" (school=SKUUL, food=FUUD)
11. Sonido "ai" (like, bike, five): usa "ai"
12. Sonido "au/ow" (how, brown, down): usa "au"
13. Sílaba tónica en MAYÚSCULAS
14. Para pares verbales (Go / Went): pronuncia ambas separadas por " / "
15. Para frases (Good morning): pronuncia la frase completa

EJEMPLOS VERIFICADOS:
- Hello → je-LOU
- Sorry → SO-ri  
- Orange → O-ranch
- Goodbye → gud-BAI
- Thanks → zanks
- Welcome → UEL-com
- Beautiful → BIUU-ti-ful
- Chicken → CHI-ken
- Computer → com-PIUU-ter
- Understand → an-der-STAND
- Thanksgiving → zanks-GI-ving
- Give up → guiv AP
- Break a leg → breik a LEG
- Go / Went → gou / uent
- Three → ZRII
- School → SKUUL
- Water → UO-ter
- Phone → foun
- Chair → cher
- Think → zink
- The → de
- This → dis
- What → uot
- Where → uer
- How → jau
- Who → juu
- Why → uai
- Which → uich
- Shirt → shert
- Shoes → shuus
- Watch → uoch
- Gym → dchim
- Job → dchob
- Judge → dchAdch

Responde SOLO con JSON válido. Sin texto adicional.

Palabras:
{batch_str}"""

    import openai
    oa_client = openai.OpenAI(
        api_key=os.environ["XAI_API_KEY"],
        base_url="https://api.x.ai/v1"
    )
    response = oa_client.chat.completions.create(
        model="grok-3-latest",
        messages=[{"role": "user", "content": prompt}]
    )

    content = response.choices[0].message.content.strip()
    json_match = re.search(r'\{[\s\S]*\}', content)
    if json_match:
        try:
            batch_result = json.loads(json_match.group())
            all_pronunciations.update(batch_result)
            print(f"Lote {i//BATCH_SIZE + 1}: {len(batch_result)} OK")
        except json.JSONDecodeError as e:
            print(f"ERROR JSON lote {i//BATCH_SIZE + 1}: {e}")
            print(content[:300])
    else:
        print(f"Sin JSON en lote {i//BATCH_SIZE + 1}")
        print(content[:300])

output_path = "/home/ubuntu/gemlish/scripts/pronunciations_output.json"
with open(output_path, "w", encoding="utf-8") as f:
    json.dump(all_pronunciations, f, ensure_ascii=False, indent=2)

print(f"\nTotal: {len(all_pronunciations)} pronunciaciones")
print("Muestra:")
for k in list(all_pronunciations.keys())[:15]:
    print(f"  {k}: {all_pronunciations[k]}")
