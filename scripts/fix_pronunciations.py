"""
Script para verificar y corregir pronunciaciones usando Grok.
Reglas para pronunciación fonética en español para hispanohablantes:
- G suave (gym, general) → Y (no "dch", no "j" fuerte)
- G fuerte (go, get) → G
- J en inglés → Y (no "dch")
- TH sonora (the, this) → D
- TH sorda (think, three) → Z
- SH → SH
- CH → CH (como en "chico")
- W → U o GU
- Vocal larga → vocal doble (BIIG, FUUD)
- Sílaba tónica en MAYÚSCULAS
"""

import os
import json
import re
import time

# Leer todas las pronunciaciones actuales
with open('/tmp/all_pronunciations.txt', 'r') as f:
    lines = f.readlines()

# Saltar la primera línea (total)
word_pron_pairs = []
for line in lines[1:]:
    parts = line.strip().split('\t')
    if len(parts) == 2:
        word_pron_pairs.append({'word': parts[0], 'current': parts[1]})

print(f"Total pares: {len(word_pron_pairs)}")

# Cargar pronunciaciones ya generadas si existen
output_file = '/home/ubuntu/gemlish/scripts/fixed_pronunciations.json'
existing = {}
if os.path.exists(output_file):
    with open(output_file, 'r') as f:
        existing = json.load(f)
    print(f"Pronunciaciones ya procesadas: {len(existing)}")

# API key
api_key = os.environ.get('XAI_API_KEY', '')
if not api_key:
    print("ERROR: XAI_API_KEY no encontrada")
    exit(1)

import subprocess

def call_grok(prompt):
    payload = json.dumps({
        "model": "grok-3-mini",
        "messages": [{"role": "user", "content": prompt}],
        "temperature": 0.1,
        "max_tokens": 2000
    })
    
    result = subprocess.run([
        'curl', '-s', '-X', 'POST',
        'https://api.x.ai/v1/chat/completions',
        '-H', 'Content-Type: application/json',
        '-H', f'Authorization: Bearer {api_key}',
        '-d', payload
    ], capture_output=True, text=True, timeout=60)
    
    data = json.loads(result.stdout)
    return data['choices'][0]['message']['content']

# Procesar en lotes de 50
BATCH_SIZE = 50
all_words = [p['word'] for p in word_pron_pairs]
all_current = [p['current'] for p in word_pron_pairs]

# Filtrar los que ya están procesados
to_process = [(w, c) for w, c in zip(all_words, all_current) if w not in existing]
print(f"Por procesar: {len(to_process)}")

for i in range(0, len(to_process), BATCH_SIZE):
    batch = to_process[i:i+BATCH_SIZE]
    batch_words = [b[0] for b in batch]
    batch_current = [b[1] for b in batch]
    
    words_list = '\n'.join([f'{j+1}. {w} (actual: {c})' for j, (w, c) in enumerate(zip(batch_words, batch_current))])
    
    prompt = f"""Eres un experto en pronunciación inglesa para hispanohablantes de América Latina.

Revisa y CORRIGE estas pronunciaciones fonéticas en español. Las pronunciaciones deben ser fáciles de leer para alguien que solo habla español.

REGLAS ESTRICTAS:
1. G suave (gym, giant, general, giraffe, gel) → usar "Y" (gym = YIM, not "dchim")
2. G fuerte (go, get, game, good) → usar "G" 
3. J en inglés → usar "Y" (job = YOB, jump = YAMP)
4. TH sonora (the, this, that, there) → usar "D" (the = DE, this = DIS)
5. TH sorda (think, three, thanks, tooth) → usar "Z" (think = ZINK, three = ZRII)
6. SH → usar "SH" (shoe = SHUU, shop = SHOP)
7. CH → usar "CH" (chair = CHER, cheese = CHIIS)
8. W → usar "U" o "GU" (water = UO-ter, window = UIN-dou)
9. Vocales largas → duplicar (see = SII, food = FUUD, school = SKUUL)
10. Sílaba tónica en MAYÚSCULAS, resto en minúsculas
11. Separar sílabas con guión (-)
12. NO usar caracteres IPA (ə, ɪ, ʊ, etc.)
13. La R inglesa (especialmente al final) suena diferente: usar "r" suave
14. "tion" → "shon" (nation = NEI-shon)
15. "ck" → "k" (back = BAK, black = BLAK)

Palabras a corregir:
{words_list}

Responde SOLO con JSON válido, sin markdown, sin explicaciones:
{{"pronunciations": [{{"word": "Hello", "pronunciation": "je-LOU"}}, ...]}}

Incluye TODAS las {len(batch_words)} palabras en el array."""

    try:
        print(f"Procesando lote {i//BATCH_SIZE + 1} ({len(batch_words)} palabras)...")
        response = call_grok(prompt)
        
        # Limpiar respuesta
        response = response.strip()
        if response.startswith('```'):
            response = re.sub(r'^```[a-z]*\n?', '', response)
            response = re.sub(r'\n?```$', '', response)
        
        data = json.loads(response)
        prons = data.get('pronunciations', [])
        
        for item in prons:
            if 'word' in item and 'pronunciation' in item:
                existing[item['word']] = item['pronunciation']
        
        print(f"  Procesadas: {len(prons)} palabras")
        
        # Guardar progreso
        with open(output_file, 'w') as f:
            json.dump(existing, f, ensure_ascii=False, indent=2)
        
        time.sleep(1)
        
    except Exception as e:
        print(f"  ERROR en lote {i//BATCH_SIZE + 1}: {e}")
        time.sleep(2)

print(f"\nTotal pronunciaciones corregidas: {len(existing)}")
print(f"Guardado en: {output_file}")
