"""
Aplica las pronunciaciones generadas al archivo lessons.ts
"""
import json
import re

# Cargar pronunciaciones
with open("/home/ubuntu/gemlish/scripts/pronunciations_output.json", "r", encoding="utf-8") as f:
    raw = json.load(f)

# Aplanar el JSON (algunos lotes generaron objetos anidados)
pronunciations = {}
def flatten(obj, prefix=""):
    if isinstance(obj, dict):
        for k, v in obj.items():
            if isinstance(v, str):
                pronunciations[k] = v
            elif isinstance(v, dict):
                flatten(v)
    elif isinstance(obj, str):
        pronunciations[prefix] = obj

flatten(raw)

# Agregar las que faltan manualmente (lotes que fallaron)
missing = {
    "Cart": "KART",
    "Cashier": "ka-SHIR",
    "Aisle": "AIL",
    "Organic": "or-GA-nik",
    "Frozen": "FROU-sen",
    "Expiration date": "eks-pi-REI-shon DEIT",
    "Bag": "BAG",
    "Coupon": "KUU-pon",
    "Checkout": "CHEK-aut",
    "Refund": "RII-fand",
    "Appointment": "a-POINT-ment",
    "Prescription": "pres-KRIP-shon",
    "Symptom": "SIMP-tom",
    "Surgery": "SER-dche-ri",
    "Emergency": "i-MER-dchen-si",
    "Pharmacy": "FAR-ma-si",
    "Recovery": "ri-KA-ve-ri",
    "Diagnosis": "dai-ag-NOU-sis",
    "Specialist": "SPE-sha-list",
    "Insurance": "in-SHUR-ans",
    "Deposit": "de-PO-sit",
    "Withdrawal": "uiz-DRO-al",
    "Transfer": "TRANS-fer",
    "Interest rate": "IN-te-rest REIT",
    "Loan": "LOUN",
    "ATM": "ei-tii-EM",
    "Balance": "BA-lans",
    "Credit card": "KRE-dit KARD",
    "Currency": "KA-ren-si",
    "Mortgage": "MOR-guech",
    "Give up": "guiv AP",
    "Look up": "luk AP",
    "Turn on": "tern ON",
    "Turn off": "tern OF",
    "Pick up": "pik AP",
    "Find out": "faind AUT",
    "Come back": "kam BAK",
    "Get up": "get AP",
    "Run out": "ran AUT",
    "Set up": "set AP",
    "Carry out": "KA-ri aut",
    "Break down": "breik DAUN",
    "Take off": "teik OF",
    "Put on": "put ON",
    "Look for": "luk FOR",
    "Go on": "gou ON",
    "Show up": "shou AP",
    "Work out": "uork AUT",
    "Point out": "point AUT",
    "Call off": "kol OF",
    "Hobby": "JO-bi",
    "Concert": "KON-sert",
    "Museum": "miu-SII-um",
    "Theater": "ZII-ter",
    "Festival": "FES-ti-val",
    "Camping": "KAM-ping",
    "Photography": "fo-TO-gra-fi",
    "Cooking": "KU-king",
    "Reading": "RII-ding",
    "Gardening": "GAR-de-ning",
}
pronunciations.update(missing)

print(f"Total pronunciaciones: {len(pronunciations)}")

# Leer el archivo de lecciones
with open("/home/ubuntu/gemlish/data/lessons.ts", "r", encoding="utf-8") as f:
    content = f.read()

# Reemplazar todas las pronunciaciones IPA con las nuevas
# El patrón busca: pronunciation: "/.../"  o  pronunciation: "..."
def replace_pronunciation(match):
    word_field = match.group(1)  # el valor de "word"
    old_pron = match.group(2)    # la pronunciación vieja
    
    # Extraer la palabra base (sin la traducción en pares como "Go / Went")
    word_clean = word_field.strip()
    
    # Buscar en el diccionario
    new_pron = pronunciations.get(word_clean)
    
    if new_pron:
        return f'pronunciation: "{new_pron}"'
    else:
        print(f"  Sin pronunciación para: '{word_clean}'")
        return match.group(0)  # dejar igual

# Patrón para encontrar bloques de word + pronunciation
# { word: "X", translation: "Y", pronunciation: "Z", ...}
pattern = re.compile(
    r'\{ word: "([^"]+)"[^}]+?pronunciation: "([^"]*)"',
    re.DOTALL
)

# Contar reemplazos
count = 0
not_found = []

def replace_in_block(match):
    global count
    word_val = match.group(1)
    old_pron = match.group(2)
    new_pron = pronunciations.get(word_val)
    if new_pron:
        count += 1
        return match.group(0).replace(f'pronunciation: "{old_pron}"', f'pronunciation: "{new_pron}"')
    else:
        not_found.append(word_val)
        return match.group(0)

new_content = pattern.sub(replace_in_block, content)

print(f"Reemplazos realizados: {count}")
if not_found:
    print(f"Sin pronunciación ({len(not_found)}): {not_found}")

# Guardar
with open("/home/ubuntu/gemlish/data/lessons.ts", "w", encoding="utf-8") as f:
    f.write(new_content)

print("lessons.ts actualizado correctamente")
