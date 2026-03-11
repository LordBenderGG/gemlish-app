export interface Word {
  word: string;
  translation: string;
  pronunciation: string;
  example: string;
  exampleEs: string;
}

export interface Lesson {
  id: number;
  name: string;
  color: string;
  words: Word[];
}

export const LESSONS: Lesson[] = [
  {
    id: 1, name: "Saludos", color: "#58CC02",
    words: [
      { word: "Hello", translation: "Hola", pronunciation: "/həˈloʊ/", example: "Hello, how are you?", exampleEs: "Hola, ¿cómo estás?" },
      { word: "Hi", translation: "Hola (informal)", pronunciation: "/haɪ/", example: "Hi there!", exampleEs: "¡Hola!" },
      { word: "Bye", translation: "Adiós", pronunciation: "/baɪ/", example: "Bye, see you later!", exampleEs: "Adiós, ¡hasta luego!" },
      { word: "Goodbye", translation: "Adiós (formal)", pronunciation: "/ˌɡʊdˈbaɪ/", example: "Goodbye, have a nice day!", exampleEs: "Adiós, ¡que tengas un buen día!" },
      { word: "Yes", translation: "Sí", pronunciation: "/jɛs/", example: "Yes, I agree.", exampleEs: "Sí, estoy de acuerdo." },
      { word: "No", translation: "No", pronunciation: "/noʊ/", example: "No, thank you.", exampleEs: "No, gracias." },
      { word: "Please", translation: "Por favor", pronunciation: "/pliːz/", example: "Please help me.", exampleEs: "Por favor, ayúdame." },
      { word: "Thanks", translation: "Gracias", pronunciation: "/θæŋks/", example: "Thanks for your help!", exampleEs: "¡Gracias por tu ayuda!" },
      { word: "Sorry", translation: "Lo siento", pronunciation: "/ˈsɒri/", example: "Sorry, I was late.", exampleEs: "Lo siento, llegué tarde." },
      { word: "Welcome", translation: "Bienvenido", pronunciation: "/ˈwɛlkəm/", example: "Welcome to our home!", exampleEs: "¡Bienvenido a nuestra casa!" },
    ],
  },
  {
    id: 2, name: "Números 1-10", color: "#1CB0F6",
    words: [
      { word: "One", translation: "Uno", pronunciation: "/wʌn/", example: "I have one cat.", exampleEs: "Tengo un gato." },
      { word: "Two", translation: "Dos", pronunciation: "/tuː/", example: "I have two dogs.", exampleEs: "Tengo dos perros." },
      { word: "Three", translation: "Tres", pronunciation: "/θriː/", example: "There are three apples.", exampleEs: "Hay tres manzanas." },
      { word: "Four", translation: "Cuatro", pronunciation: "/fɔːr/", example: "She has four books.", exampleEs: "Ella tiene cuatro libros." },
      { word: "Five", translation: "Cinco", pronunciation: "/faɪv/", example: "He is five years old.", exampleEs: "Él tiene cinco años." },
      { word: "Six", translation: "Seis", pronunciation: "/sɪks/", example: "We need six chairs.", exampleEs: "Necesitamos seis sillas." },
      { word: "Seven", translation: "Siete", pronunciation: "/ˈsɛvən/", example: "There are seven days in a week.", exampleEs: "Hay siete días en la semana." },
      { word: "Eight", translation: "Ocho", pronunciation: "/eɪt/", example: "I wake up at eight.", exampleEs: "Me despierto a las ocho." },
      { word: "Nine", translation: "Nueve", pronunciation: "/naɪn/", example: "Nine students are here.", exampleEs: "Nueve estudiantes están aquí." },
      { word: "Ten", translation: "Diez", pronunciation: "/tɛn/", example: "Count to ten.", exampleEs: "Cuenta hasta diez." },
    ],
  },
  {
    id: 3, name: "Colores", color: "#FF6D6D",
    words: [
      { word: "Red", translation: "Rojo", pronunciation: "/rɛd/", example: "The apple is red.", exampleEs: "La manzana es roja." },
      { word: "Blue", translation: "Azul", pronunciation: "/bluː/", example: "The sky is blue.", exampleEs: "El cielo es azul." },
      { word: "Green", translation: "Verde", pronunciation: "/ɡriːn/", example: "The grass is green.", exampleEs: "El pasto es verde." },
      { word: "Yellow", translation: "Amarillo", pronunciation: "/ˈjɛloʊ/", example: "The sun is yellow.", exampleEs: "El sol es amarillo." },
      { word: "Orange", translation: "Naranja", pronunciation: "/ˈɒrɪndʒ/", example: "I like orange color.", exampleEs: "Me gusta el color naranja." },
      { word: "Purple", translation: "Morado", pronunciation: "/ˈpɜːrpəl/", example: "She has a purple bag.", exampleEs: "Ella tiene una bolsa morada." },
      { word: "Pink", translation: "Rosa", pronunciation: "/pɪŋk/", example: "Her dress is pink.", exampleEs: "Su vestido es rosa." },
      { word: "Black", translation: "Negro", pronunciation: "/blæk/", example: "The cat is black.", exampleEs: "El gato es negro." },
      { word: "White", translation: "Blanco", pronunciation: "/waɪt/", example: "Snow is white.", exampleEs: "La nieve es blanca." },
      { word: "Brown", translation: "Marrón", pronunciation: "/braʊn/", example: "The dog is brown.", exampleEs: "El perro es marrón." },
    ],
  },
  {
    id: 4, name: "Animales", color: "#8E5AF5",
    words: [
      { word: "Dog", translation: "Perro", pronunciation: "/dɒɡ/", example: "The dog is barking.", exampleEs: "El perro está ladrando." },
      { word: "Cat", translation: "Gato", pronunciation: "/kæt/", example: "The cat is sleeping.", exampleEs: "El gato está durmiendo." },
      { word: "Bird", translation: "Pájaro", pronunciation: "/bɜːrd/", example: "The bird is singing.", exampleEs: "El pájaro está cantando." },
      { word: "Fish", translation: "Pez", pronunciation: "/fɪʃ/", example: "The fish swims fast.", exampleEs: "El pez nada rápido." },
      { word: "Horse", translation: "Caballo", pronunciation: "/hɔːrs/", example: "The horse runs in the field.", exampleEs: "El caballo corre en el campo." },
      { word: "Cow", translation: "Vaca", pronunciation: "/kaʊ/", example: "The cow gives milk.", exampleEs: "La vaca da leche." },
      { word: "Pig", translation: "Cerdo", pronunciation: "/pɪɡ/", example: "The pig is in the farm.", exampleEs: "El cerdo está en la granja." },
      { word: "Sheep", translation: "Oveja", pronunciation: "/ʃiːp/", example: "The sheep has white wool.", exampleEs: "La oveja tiene lana blanca." },
      { word: "Duck", translation: "Pato", pronunciation: "/dʌk/", example: "The duck swims in the pond.", exampleEs: "El pato nada en el estanque." },
      { word: "Chicken", translation: "Pollo/Gallina", pronunciation: "/ˈtʃɪkɪn/", example: "The chicken lays eggs.", exampleEs: "La gallina pone huevos." },
    ],
  },
  {
    id: 5, name: "Mi Familia", color: "#FF9600",
    words: [
      { word: "Mother", translation: "Mamá", pronunciation: "/ˈmʌðər/", example: "My mother is kind.", exampleEs: "Mi mamá es amable." },
      { word: "Father", translation: "Papá", pronunciation: "/ˈfɑːðər/", example: "My father works hard.", exampleEs: "Mi papá trabaja duro." },
      { word: "Sister", translation: "Hermana", pronunciation: "/ˈsɪstər/", example: "My sister is older than me.", exampleEs: "Mi hermana es mayor que yo." },
      { word: "Brother", translation: "Hermano", pronunciation: "/ˈbrʌðər/", example: "My brother plays soccer.", exampleEs: "Mi hermano juega fútbol." },
      { word: "Baby", translation: "Bebé", pronunciation: "/ˈbeɪbi/", example: "The baby is sleeping.", exampleEs: "El bebé está durmiendo." },
      { word: "Grandmother", translation: "Abuela", pronunciation: "/ˈɡrænˌmʌðər/", example: "My grandmother tells stories.", exampleEs: "Mi abuela cuenta historias." },
      { word: "Grandfather", translation: "Abuelo", pronunciation: "/ˈɡrænˌfɑːðər/", example: "My grandfather is funny.", exampleEs: "Mi abuelo es gracioso." },
      { word: "Friend", translation: "Amigo/a", pronunciation: "/frɛnd/", example: "She is my best friend.", exampleEs: "Ella es mi mejor amiga." },
      { word: "Son", translation: "Hijo", pronunciation: "/sʌn/", example: "He is my son.", exampleEs: "Él es mi hijo." },
      { word: "Daughter", translation: "Hija", pronunciation: "/ˈdɔːtər/", example: "She is my daughter.", exampleEs: "Ella es mi hija." },
    ],
  },
  {
    id: 6, name: "Mi Cuerpo", color: "#58CC02",
    words: [
      { word: "Eye", translation: "Ojo", pronunciation: "/aɪ/", example: "She has brown eyes.", exampleEs: "Ella tiene ojos cafés." },
      { word: "Ear", translation: "Oreja", pronunciation: "/ɪər/", example: "I can hear with my ear.", exampleEs: "Puedo escuchar con mi oreja." },
      { word: "Nose", translation: "Nariz", pronunciation: "/noʊz/", example: "My nose is cold.", exampleEs: "Mi nariz está fría." },
      { word: "Mouth", translation: "Boca", pronunciation: "/maʊθ/", example: "Open your mouth.", exampleEs: "Abre tu boca." },
      { word: "Hand", translation: "Mano", pronunciation: "/hænd/", example: "Wash your hands.", exampleEs: "Lávate las manos." },
      { word: "Foot", translation: "Pie", pronunciation: "/fʊt/", example: "My foot hurts.", exampleEs: "Me duele el pie." },
      { word: "Leg", translation: "Pierna", pronunciation: "/lɛɡ/", example: "She broke her leg.", exampleEs: "Ella se rompió la pierna." },
      { word: "Arm", translation: "Brazo", pronunciation: "/ɑːrm/", example: "He hurt his arm.", exampleEs: "Él se lastimó el brazo." },
      { word: "Head", translation: "Cabeza", pronunciation: "/hɛd/", example: "My head hurts.", exampleEs: "Me duele la cabeza." },
      { word: "Hair", translation: "Cabello", pronunciation: "/hɛər/", example: "She has long hair.", exampleEs: "Ella tiene el cabello largo." },
    ],
  },
  {
    id: 7, name: "La Comida", color: "#FF6D6D",
    words: [
      { word: "Water", translation: "Agua", pronunciation: "/ˈwɔːtər/", example: "I drink water every day.", exampleEs: "Bebo agua todos los días." },
      { word: "Milk", translation: "Leche", pronunciation: "/mɪlk/", example: "The baby drinks milk.", exampleEs: "El bebé bebe leche." },
      { word: "Bread", translation: "Pan", pronunciation: "/brɛd/", example: "I eat bread for breakfast.", exampleEs: "Como pan en el desayuno." },
      { word: "Egg", translation: "Huevo", pronunciation: "/ɛɡ/", example: "She cooked an egg.", exampleEs: "Ella cocinó un huevo." },
      { word: "Apple", translation: "Manzana", pronunciation: "/ˈæpəl/", example: "An apple a day keeps the doctor away.", exampleEs: "Una manzana al día mantiene al médico lejos." },
      { word: "Rice", translation: "Arroz", pronunciation: "/raɪs/", example: "We eat rice for lunch.", exampleEs: "Comemos arroz en el almuerzo." },
      { word: "Chicken", translation: "Pollo", pronunciation: "/ˈtʃɪkɪn/", example: "I like grilled chicken.", exampleEs: "Me gusta el pollo a la parrilla." },
      { word: "Soup", translation: "Sopa", pronunciation: "/suːp/", example: "The soup is hot.", exampleEs: "La sopa está caliente." },
      { word: "Salad", translation: "Ensalada", pronunciation: "/ˈsæləd/", example: "I eat salad every day.", exampleEs: "Como ensalada todos los días." },
      { word: "Coffee", translation: "Café", pronunciation: "/ˈkɒfi/", example: "I drink coffee in the morning.", exampleEs: "Bebo café en la mañana." },
    ],
  },
  {
    id: 8, name: "La Casa", color: "#1CB0F6",
    words: [
      { word: "House", translation: "Casa", pronunciation: "/haʊs/", example: "I live in a big house.", exampleEs: "Vivo en una casa grande." },
      { word: "Room", translation: "Habitación", pronunciation: "/ruːm/", example: "My room is clean.", exampleEs: "Mi habitación está limpia." },
      { word: "Kitchen", translation: "Cocina", pronunciation: "/ˈkɪtʃɪn/", example: "Mom is in the kitchen.", exampleEs: "Mamá está en la cocina." },
      { word: "Bathroom", translation: "Baño", pronunciation: "/ˈbæθruːm/", example: "The bathroom is upstairs.", exampleEs: "El baño está arriba." },
      { word: "Door", translation: "Puerta", pronunciation: "/dɔːr/", example: "Please close the door.", exampleEs: "Por favor cierra la puerta." },
      { word: "Window", translation: "Ventana", pronunciation: "/ˈwɪndoʊ/", example: "Open the window, please.", exampleEs: "Abre la ventana, por favor." },
      { word: "Table", translation: "Mesa", pronunciation: "/ˈteɪbəl/", example: "Put it on the table.", exampleEs: "Ponlo sobre la mesa." },
      { word: "Chair", translation: "Silla", pronunciation: "/tʃɛər/", example: "Sit on the chair.", exampleEs: "Siéntate en la silla." },
      { word: "Bed", translation: "Cama", pronunciation: "/bɛd/", example: "I sleep in my bed.", exampleEs: "Duermo en mi cama." },
      { word: "Garden", translation: "Jardín", pronunciation: "/ˈɡɑːrdən/", example: "We have a beautiful garden.", exampleEs: "Tenemos un jardín hermoso." },
    ],
  },
  {
    id: 9, name: "Ropa y Moda", color: "#8E5AF5",
    words: [
      { word: "Shirt", translation: "Camisa", pronunciation: "/ʃɜːrt/", example: "He wears a blue shirt.", exampleEs: "Él usa una camisa azul." },
      { word: "Pants", translation: "Pantalones", pronunciation: "/pænts/", example: "These pants are too long.", exampleEs: "Estos pantalones son muy largos." },
      { word: "Shoes", translation: "Zapatos", pronunciation: "/ʃuːz/", example: "I need new shoes.", exampleEs: "Necesito zapatos nuevos." },
      { word: "Dress", translation: "Vestido", pronunciation: "/drɛs/", example: "She wears a red dress.", exampleEs: "Ella usa un vestido rojo." },
      { word: "Hat", translation: "Sombrero", pronunciation: "/hæt/", example: "He wears a hat in the sun.", exampleEs: "Él usa sombrero en el sol." },
      { word: "Jacket", translation: "Chaqueta", pronunciation: "/ˈdʒækɪt/", example: "It's cold, wear your jacket.", exampleEs: "Hace frío, usa tu chaqueta." },
      { word: "Socks", translation: "Calcetines", pronunciation: "/sɒks/", example: "I need clean socks.", exampleEs: "Necesito calcetines limpios." },
      { word: "Glasses", translation: "Gafas", pronunciation: "/ˈɡlɑːsɪz/", example: "She wears glasses to read.", exampleEs: "Ella usa gafas para leer." },
      { word: "Belt", translation: "Cinturón", pronunciation: "/bɛlt/", example: "He wears a leather belt.", exampleEs: "Él usa un cinturón de cuero." },
      { word: "Scarf", translation: "Bufanda", pronunciation: "/skɑːrf/", example: "She wears a scarf in winter.", exampleEs: "Ella usa bufanda en invierno." },
    ],
  },
  {
    id: 10, name: "El Tiempo", color: "#FF9600",
    words: [
      { word: "Sun", translation: "Sol", pronunciation: "/sʌn/", example: "The sun is shining.", exampleEs: "El sol está brillando." },
      { word: "Rain", translation: "Lluvia", pronunciation: "/reɪn/", example: "I love the rain.", exampleEs: "Me encanta la lluvia." },
      { word: "Snow", translation: "Nieve", pronunciation: "/snoʊ/", example: "Children play in the snow.", exampleEs: "Los niños juegan en la nieve." },
      { word: "Wind", translation: "Viento", pronunciation: "/wɪnd/", example: "The wind is strong today.", exampleEs: "El viento es fuerte hoy." },
      { word: "Cloud", translation: "Nube", pronunciation: "/klaʊd/", example: "There are dark clouds.", exampleEs: "Hay nubes oscuras." },
      { word: "Hot", translation: "Caliente/Caluroso", pronunciation: "/hɒt/", example: "It is very hot today.", exampleEs: "Hace mucho calor hoy." },
      { word: "Cold", translation: "Frío", pronunciation: "/koʊld/", example: "It is cold outside.", exampleEs: "Hace frío afuera." },
      { word: "Storm", translation: "Tormenta", pronunciation: "/stɔːrm/", example: "A big storm is coming.", exampleEs: "Se acerca una gran tormenta." },
      { word: "Rainbow", translation: "Arcoíris", pronunciation: "/ˈreɪnboʊ/", example: "Look at the rainbow!", exampleEs: "¡Mira el arcoíris!" },
      { word: "Fog", translation: "Niebla", pronunciation: "/fɒɡ/", example: "There is fog in the morning.", exampleEs: "Hay niebla en la mañana." },
    ],
  },
  {
    id: 11, name: "Transporte", color: "#58CC02",
    words: [
      { word: "Car", translation: "Carro/Auto", pronunciation: "/kɑːr/", example: "I drive a red car.", exampleEs: "Manejo un carro rojo." },
      { word: "Bus", translation: "Autobús", pronunciation: "/bʌs/", example: "I take the bus to work.", exampleEs: "Tomo el autobús al trabajo." },
      { word: "Train", translation: "Tren", pronunciation: "/treɪn/", example: "The train is fast.", exampleEs: "El tren es rápido." },
      { word: "Plane", translation: "Avión", pronunciation: "/pleɪn/", example: "We travel by plane.", exampleEs: "Viajamos en avión." },
      { word: "Bike", translation: "Bicicleta", pronunciation: "/baɪk/", example: "She rides her bike.", exampleEs: "Ella monta su bicicleta." },
      { word: "Taxi", translation: "Taxi", pronunciation: "/ˈtæksi/", example: "Let's take a taxi.", exampleEs: "Tomemos un taxi." },
      { word: "Ship", translation: "Barco", pronunciation: "/ʃɪp/", example: "The ship sails the ocean.", exampleEs: "El barco navega el océano." },
      { word: "Motorcycle", translation: "Motocicleta", pronunciation: "/ˈmoʊtərsaɪkəl/", example: "He rides a motorcycle.", exampleEs: "Él monta una motocicleta." },
      { word: "Subway", translation: "Metro", pronunciation: "/ˈsʌbweɪ/", example: "I take the subway downtown.", exampleEs: "Tomo el metro al centro." },
      { word: "Helicopter", translation: "Helicóptero", pronunciation: "/ˈhɛlɪkɒptər/", example: "The helicopter flies over the city.", exampleEs: "El helicóptero vuela sobre la ciudad." },
    ],
  },
  {
    id: 12, name: "Profesiones", color: "#1CB0F6",
    words: [
      { word: "Doctor", translation: "Médico", pronunciation: "/ˈdɒktər/", example: "The doctor helps sick people.", exampleEs: "El médico ayuda a los enfermos." },
      { word: "Teacher", translation: "Maestro/a", pronunciation: "/ˈtiːtʃər/", example: "My teacher is very kind.", exampleEs: "Mi maestra es muy amable." },
      { word: "Police", translation: "Policía", pronunciation: "/pəˈliːs/", example: "The police protect us.", exampleEs: "La policía nos protege." },
      { word: "Chef", translation: "Chef/Cocinero", pronunciation: "/ʃɛf/", example: "The chef cooks delicious food.", exampleEs: "El chef cocina comida deliciosa." },
      { word: "Engineer", translation: "Ingeniero", pronunciation: "/ˌɛndʒɪˈnɪər/", example: "She is a software engineer.", exampleEs: "Ella es ingeniera de software." },
      { word: "Nurse", translation: "Enfermero/a", pronunciation: "/nɜːrs/", example: "The nurse takes care of patients.", exampleEs: "La enfermera cuida a los pacientes." },
      { word: "Lawyer", translation: "Abogado/a", pronunciation: "/ˈlɔːjər/", example: "He is a good lawyer.", exampleEs: "Él es un buen abogado." },
      { word: "Pilot", translation: "Piloto", pronunciation: "/ˈpaɪlət/", example: "The pilot flies the plane.", exampleEs: "El piloto vuela el avión." },
      { word: "Farmer", translation: "Agricultor", pronunciation: "/ˈfɑːrmər/", example: "The farmer grows vegetables.", exampleEs: "El agricultor cultiva verduras." },
      { word: "Artist", translation: "Artista", pronunciation: "/ˈɑːrtɪst/", example: "She is a talented artist.", exampleEs: "Ella es una artista talentosa." },
    ],
  },
  {
    id: 13, name: "Deportes", color: "#FF6D6D",
    words: [
      { word: "Soccer", translation: "Fútbol", pronunciation: "/ˈsɒkər/", example: "I play soccer on weekends.", exampleEs: "Juego fútbol los fines de semana." },
      { word: "Basketball", translation: "Baloncesto", pronunciation: "/ˈbɑːskɪtbɔːl/", example: "He plays basketball very well.", exampleEs: "Él juega baloncesto muy bien." },
      { word: "Swimming", translation: "Natación", pronunciation: "/ˈswɪmɪŋ/", example: "Swimming is good for health.", exampleEs: "La natación es buena para la salud." },
      { word: "Tennis", translation: "Tenis", pronunciation: "/ˈtɛnɪs/", example: "She plays tennis every morning.", exampleEs: "Ella juega tenis cada mañana." },
      { word: "Running", translation: "Correr", pronunciation: "/ˈrʌnɪŋ/", example: "I go running in the park.", exampleEs: "Salgo a correr en el parque." },
      { word: "Gym", translation: "Gimnasio", pronunciation: "/dʒɪm/", example: "I go to the gym three times a week.", exampleEs: "Voy al gimnasio tres veces a la semana." },
      { word: "Baseball", translation: "Béisbol", pronunciation: "/ˈbeɪsbɔːl/", example: "Baseball is popular in the USA.", exampleEs: "El béisbol es popular en EE.UU." },
      { word: "Volleyball", translation: "Voleibol", pronunciation: "/ˈvɒlibɔːl/", example: "We play volleyball at the beach.", exampleEs: "Jugamos voleibol en la playa." },
      { word: "Golf", translation: "Golf", pronunciation: "/ɡɒlf/", example: "My dad plays golf.", exampleEs: "Mi papá juega golf." },
      { word: "Boxing", translation: "Boxeo", pronunciation: "/ˈbɒksɪŋ/", example: "Boxing requires strength.", exampleEs: "El boxeo requiere fuerza." },
    ],
  },
  {
    id: 14, name: "Tecnología", color: "#8E5AF5",
    words: [
      { word: "Phone", translation: "Teléfono", pronunciation: "/foʊn/", example: "My phone is new.", exampleEs: "Mi teléfono es nuevo." },
      { word: "Computer", translation: "Computadora", pronunciation: "/kəmˈpjuːtər/", example: "I work on my computer.", exampleEs: "Trabajo en mi computadora." },
      { word: "Internet", translation: "Internet", pronunciation: "/ˈɪntərˌnɛt/", example: "The internet is fast here.", exampleEs: "El internet es rápido aquí." },
      { word: "Email", translation: "Correo electrónico", pronunciation: "/ˈiːmeɪl/", example: "Send me an email.", exampleEs: "Envíame un correo electrónico." },
      { word: "App", translation: "Aplicación", pronunciation: "/æp/", example: "Download the app on your phone.", exampleEs: "Descarga la aplicación en tu teléfono." },
      { word: "Password", translation: "Contraseña", pronunciation: "/ˈpæswɜːrd/", example: "Don't share your password.", exampleEs: "No compartas tu contraseña." },
      { word: "Screen", translation: "Pantalla", pronunciation: "/skriːn/", example: "The screen is broken.", exampleEs: "La pantalla está rota." },
      { word: "Camera", translation: "Cámara", pronunciation: "/ˈkæmərə/", example: "Take a photo with the camera.", exampleEs: "Toma una foto con la cámara." },
      { word: "Battery", translation: "Batería", pronunciation: "/ˈbætəri/", example: "My battery is low.", exampleEs: "Mi batería está baja." },
      { word: "Wifi", translation: "Wifi", pronunciation: "/ˈwaɪfaɪ/", example: "What is the wifi password?", exampleEs: "¿Cuál es la contraseña del wifi?" },
    ],
  },
  {
    id: 15, name: "Naturaleza", color: "#58CC02",
    words: [
      { word: "Tree", translation: "Árbol", pronunciation: "/triː/", example: "The tree is very tall.", exampleEs: "El árbol es muy alto." },
      { word: "Flower", translation: "Flor", pronunciation: "/ˈflaʊər/", example: "She gave me a flower.", exampleEs: "Ella me dio una flor." },
      { word: "River", translation: "Río", pronunciation: "/ˈrɪvər/", example: "The river flows to the sea.", exampleEs: "El río fluye hacia el mar." },
      { word: "Mountain", translation: "Montaña", pronunciation: "/ˈmaʊntɪn/", example: "We climbed the mountain.", exampleEs: "Escalamos la montaña." },
      { word: "Ocean", translation: "Océano", pronunciation: "/ˈoʊʃən/", example: "The ocean is deep.", exampleEs: "El océano es profundo." },
      { word: "Forest", translation: "Bosque", pronunciation: "/ˈfɒrɪst/", example: "The forest is full of animals.", exampleEs: "El bosque está lleno de animales." },
      { word: "Desert", translation: "Desierto", pronunciation: "/ˈdɛzərt/", example: "The desert is very hot.", exampleEs: "El desierto es muy caluroso." },
      { word: "Beach", translation: "Playa", pronunciation: "/biːtʃ/", example: "I love the beach.", exampleEs: "Me encanta la playa." },
      { word: "Island", translation: "Isla", pronunciation: "/ˈaɪlənd/", example: "They live on an island.", exampleEs: "Ellos viven en una isla." },
      { word: "Grass", translation: "Hierba/Pasto", pronunciation: "/ɡrɑːs/", example: "The grass is green.", exampleEs: "El pasto es verde." },
    ],
  },
  {
    id: 16, name: "Emociones", color: "#FF9600",
    words: [
      { word: "Happy", translation: "Feliz", pronunciation: "/ˈhæpi/", example: "I am very happy today.", exampleEs: "Estoy muy feliz hoy." },
      { word: "Sad", translation: "Triste", pronunciation: "/sæd/", example: "She looks sad.", exampleEs: "Ella parece triste." },
      { word: "Angry", translation: "Enojado", pronunciation: "/ˈæŋɡri/", example: "He is angry at me.", exampleEs: "Él está enojado conmigo." },
      { word: "Scared", translation: "Asustado", pronunciation: "/skɛrd/", example: "The child is scared of the dark.", exampleEs: "El niño tiene miedo de la oscuridad." },
      { word: "Excited", translation: "Emocionado", pronunciation: "/ɪkˈsaɪtɪd/", example: "I am excited about the trip.", exampleEs: "Estoy emocionado por el viaje." },
      { word: "Tired", translation: "Cansado", pronunciation: "/ˈtaɪərd/", example: "I am very tired.", exampleEs: "Estoy muy cansado." },
      { word: "Surprised", translation: "Sorprendido", pronunciation: "/sərˈpraɪzd/", example: "She was surprised by the gift.", exampleEs: "Ella se sorprendió con el regalo." },
      { word: "Nervous", translation: "Nervioso", pronunciation: "/ˈnɜːrvəs/", example: "He is nervous before the exam.", exampleEs: "Él está nervioso antes del examen." },
      { word: "Proud", translation: "Orgulloso", pronunciation: "/praʊd/", example: "I am proud of you.", exampleEs: "Estoy orgulloso de ti." },
      { word: "Bored", translation: "Aburrido", pronunciation: "/bɔːrd/", example: "She is bored at home.", exampleEs: "Ella está aburrida en casa." },
    ],
  },
  {
    id: 17, name: "Verbos Básicos", color: "#1CB0F6",
    words: [
      { word: "Eat", translation: "Comer", pronunciation: "/iːt/", example: "I eat breakfast every morning.", exampleEs: "Como desayuno cada mañana." },
      { word: "Drink", translation: "Beber", pronunciation: "/drɪŋk/", example: "She drinks water.", exampleEs: "Ella bebe agua." },
      { word: "Sleep", translation: "Dormir", pronunciation: "/sliːp/", example: "I sleep eight hours.", exampleEs: "Duermo ocho horas." },
      { word: "Walk", translation: "Caminar", pronunciation: "/wɔːk/", example: "We walk to school.", exampleEs: "Caminamos a la escuela." },
      { word: "Run", translation: "Correr", pronunciation: "/rʌn/", example: "He runs every day.", exampleEs: "Él corre todos los días." },
      { word: "Read", translation: "Leer", pronunciation: "/riːd/", example: "I read books.", exampleEs: "Leo libros." },
      { word: "Write", translation: "Escribir", pronunciation: "/raɪt/", example: "She writes letters.", exampleEs: "Ella escribe cartas." },
      { word: "Speak", translation: "Hablar", pronunciation: "/spiːk/", example: "He speaks English well.", exampleEs: "Él habla inglés bien." },
      { word: "Listen", translation: "Escuchar", pronunciation: "/ˈlɪsən/", example: "Please listen to me.", exampleEs: "Por favor escúchame." },
      { word: "Watch", translation: "Ver/Mirar", pronunciation: "/wɒtʃ/", example: "We watch movies.", exampleEs: "Vemos películas." },
    ],
  },
  {
    id: 18, name: "Números 11-20", color: "#FF6D6D",
    words: [
      { word: "Eleven", translation: "Once", pronunciation: "/ɪˈlɛvən/", example: "There are eleven players.", exampleEs: "Hay once jugadores." },
      { word: "Twelve", translation: "Doce", pronunciation: "/twɛlv/", example: "Twelve months in a year.", exampleEs: "Doce meses en un año." },
      { word: "Thirteen", translation: "Trece", pronunciation: "/ˌθɜːrˈtiːn/", example: "She is thirteen years old.", exampleEs: "Ella tiene trece años." },
      { word: "Fourteen", translation: "Catorce", pronunciation: "/ˌfɔːrˈtiːn/", example: "I have fourteen cousins.", exampleEs: "Tengo catorce primos." },
      { word: "Fifteen", translation: "Quince", pronunciation: "/ˌfɪfˈtiːn/", example: "Wait fifteen minutes.", exampleEs: "Espera quince minutos." },
      { word: "Sixteen", translation: "Dieciséis", pronunciation: "/ˌsɪkˈstiːn/", example: "She turned sixteen today.", exampleEs: "Ella cumplió dieciséis hoy." },
      { word: "Seventeen", translation: "Diecisiete", pronunciation: "/ˌsɛvənˈtiːn/", example: "He is seventeen.", exampleEs: "Él tiene diecisiete." },
      { word: "Eighteen", translation: "Dieciocho", pronunciation: "/ˌeɪˈtiːn/", example: "At eighteen you are an adult.", exampleEs: "A los dieciocho eres adulto." },
      { word: "Nineteen", translation: "Diecinueve", pronunciation: "/ˌnaɪnˈtiːn/", example: "Nineteen students passed.", exampleEs: "Diecinueve estudiantes pasaron." },
      { word: "Twenty", translation: "Veinte", pronunciation: "/ˈtwɛnti/", example: "I have twenty dollars.", exampleEs: "Tengo veinte dólares." },
    ],
  },
  {
    id: 19, name: "Días y Meses", color: "#8E5AF5",
    words: [
      { word: "Monday", translation: "Lunes", pronunciation: "/ˈmʌndeɪ/", example: "Monday is the first day of the week.", exampleEs: "El lunes es el primer día de la semana." },
      { word: "Tuesday", translation: "Martes", pronunciation: "/ˈtjuːzdeɪ/", example: "I have class on Tuesday.", exampleEs: "Tengo clase el martes." },
      { word: "Wednesday", translation: "Miércoles", pronunciation: "/ˈwɛnzdeɪ/", example: "We meet on Wednesday.", exampleEs: "Nos reunimos el miércoles." },
      { word: "Thursday", translation: "Jueves", pronunciation: "/ˈθɜːrzdeɪ/", example: "Thursday is almost Friday.", exampleEs: "El jueves es casi viernes." },
      { word: "Friday", translation: "Viernes", pronunciation: "/ˈfraɪdeɪ/", example: "I love Fridays!", exampleEs: "¡Me encantan los viernes!" },
      { word: "Saturday", translation: "Sábado", pronunciation: "/ˈsætərdeɪ/", example: "Saturday is my day off.", exampleEs: "El sábado es mi día libre." },
      { word: "Sunday", translation: "Domingo", pronunciation: "/ˈsʌndeɪ/", example: "Sunday is a day of rest.", exampleEs: "El domingo es un día de descanso." },
      { word: "January", translation: "Enero", pronunciation: "/ˈdʒænjuˌɛri/", example: "January is cold.", exampleEs: "Enero es frío." },
      { word: "February", translation: "Febrero", pronunciation: "/ˈfɛbruˌɛri/", example: "February has 28 days.", exampleEs: "Febrero tiene 28 días." },
      { word: "December", translation: "Diciembre", pronunciation: "/dɪˈsɛmbər/", example: "December is the last month.", exampleEs: "Diciembre es el último mes." },
    ],
  },
  {
    id: 20, name: "Adjetivos Básicos", color: "#FF9600",
    words: [
      { word: "Big", translation: "Grande", pronunciation: "/bɪɡ/", example: "That is a big dog.", exampleEs: "Ese es un perro grande." },
      { word: "Small", translation: "Pequeño", pronunciation: "/smɔːl/", example: "She has a small cat.", exampleEs: "Ella tiene un gato pequeño." },
      { word: "Fast", translation: "Rápido", pronunciation: "/fɑːst/", example: "The car is very fast.", exampleEs: "El carro es muy rápido." },
      { word: "Slow", translation: "Lento", pronunciation: "/sloʊ/", example: "The turtle is slow.", exampleEs: "La tortuga es lenta." },
      { word: "New", translation: "Nuevo", pronunciation: "/njuː/", example: "I have a new phone.", exampleEs: "Tengo un teléfono nuevo." },
      { word: "Old", translation: "Viejo/Antiguo", pronunciation: "/oʊld/", example: "This is an old book.", exampleEs: "Este es un libro viejo." },
      { word: "Beautiful", translation: "Hermoso/a", pronunciation: "/ˈbjuːtɪfəl/", example: "What a beautiful day!", exampleEs: "¡Qué día tan hermoso!" },
      { word: "Ugly", translation: "Feo/a", pronunciation: "/ˈʌɡli/", example: "That is an ugly color.", exampleEs: "Ese es un color feo." },
      { word: "Strong", translation: "Fuerte", pronunciation: "/strɒŋ/", example: "He is very strong.", exampleEs: "Él es muy fuerte." },
      { word: "Weak", translation: "Débil", pronunciation: "/wiːk/", example: "She feels weak today.", exampleEs: "Ella se siente débil hoy." },
    ],
  },
  {
    id: 21, name: "En el Restaurante", color: "#58CC02",
    words: [
      { word: "Menu", translation: "Menú", pronunciation: "/ˈmɛnjuː/", example: "Can I see the menu?", exampleEs: "¿Puedo ver el menú?" },
      { word: "Order", translation: "Ordenar/Pedido", pronunciation: "/ˈɔːrdər/", example: "I would like to order now.", exampleEs: "Me gustaría ordenar ahora." },
      { word: "Waiter", translation: "Mesero", pronunciation: "/ˈweɪtər/", example: "The waiter is very friendly.", exampleEs: "El mesero es muy amable." },
      { word: "Bill", translation: "Cuenta", pronunciation: "/bɪl/", example: "Can I have the bill, please?", exampleEs: "¿Me puede traer la cuenta, por favor?" },
      { word: "Tip", translation: "Propina", pronunciation: "/tɪp/", example: "Leave a tip for the waiter.", exampleEs: "Deja una propina para el mesero." },
      { word: "Reservation", translation: "Reservación", pronunciation: "/ˌrɛzərˈveɪʃən/", example: "I have a reservation.", exampleEs: "Tengo una reservación." },
      { word: "Delicious", translation: "Delicioso", pronunciation: "/dɪˈlɪʃəs/", example: "This food is delicious!", exampleEs: "¡Esta comida está deliciosa!" },
      { word: "Spicy", translation: "Picante", pronunciation: "/ˈspaɪsi/", example: "Is this dish spicy?", exampleEs: "¿Este plato es picante?" },
      { word: "Dessert", translation: "Postre", pronunciation: "/dɪˈzɜːrt/", example: "I want chocolate dessert.", exampleEs: "Quiero postre de chocolate." },
      { word: "Fork", translation: "Tenedor", pronunciation: "/fɔːrk/", example: "Use a fork to eat.", exampleEs: "Usa un tenedor para comer." },
    ],
  },
  {
    id: 22, name: "Compras", color: "#1CB0F6",
    words: [
      { word: "Store", translation: "Tienda", pronunciation: "/stɔːr/", example: "I go to the store.", exampleEs: "Voy a la tienda." },
      { word: "Buy", translation: "Comprar", pronunciation: "/baɪ/", example: "I want to buy a shirt.", exampleEs: "Quiero comprar una camisa." },
      { word: "Sell", translation: "Vender", pronunciation: "/sɛl/", example: "They sell fresh fruit.", exampleEs: "Ellos venden fruta fresca." },
      { word: "Price", translation: "Precio", pronunciation: "/praɪs/", example: "What is the price?", exampleEs: "¿Cuál es el precio?" },
      { word: "Cheap", translation: "Barato", pronunciation: "/tʃiːp/", example: "This is very cheap.", exampleEs: "Esto es muy barato." },
      { word: "Expensive", translation: "Caro", pronunciation: "/ɪkˈspɛnsɪv/", example: "That car is expensive.", exampleEs: "Ese carro es caro." },
      { word: "Money", translation: "Dinero", pronunciation: "/ˈmʌni/", example: "I need more money.", exampleEs: "Necesito más dinero." },
      { word: "Card", translation: "Tarjeta", pronunciation: "/kɑːrd/", example: "Can I pay by card?", exampleEs: "¿Puedo pagar con tarjeta?" },
      { word: "Discount", translation: "Descuento", pronunciation: "/ˈdɪskaʊnt/", example: "Is there a discount?", exampleEs: "¿Hay algún descuento?" },
      { word: "Receipt", translation: "Recibo", pronunciation: "/rɪˈsiːt/", example: "Keep your receipt.", exampleEs: "Guarda tu recibo." },
    ],
  },
  {
    id: 23, name: "Salud y Cuerpo", color: "#FF6D6D",
    words: [
      { word: "Sick", translation: "Enfermo", pronunciation: "/sɪk/", example: "I feel sick today.", exampleEs: "Me siento enfermo hoy." },
      { word: "Healthy", translation: "Saludable", pronunciation: "/ˈhɛlθi/", example: "Eat healthy food.", exampleEs: "Come comida saludable." },
      { word: "Medicine", translation: "Medicina", pronunciation: "/ˈmɛdɪsɪn/", example: "Take your medicine.", exampleEs: "Toma tu medicina." },
      { word: "Hospital", translation: "Hospital", pronunciation: "/ˈhɒspɪtəl/", example: "She is in the hospital.", exampleEs: "Ella está en el hospital." },
      { word: "Pain", translation: "Dolor", pronunciation: "/peɪn/", example: "I have pain in my back.", exampleEs: "Tengo dolor en la espalda." },
      { word: "Fever", translation: "Fiebre", pronunciation: "/ˈfiːvər/", example: "He has a high fever.", exampleEs: "Él tiene fiebre alta." },
      { word: "Cough", translation: "Tos", pronunciation: "/kɒf/", example: "She has a bad cough.", exampleEs: "Ella tiene mucha tos." },
      { word: "Headache", translation: "Dolor de cabeza", pronunciation: "/ˈhɛdeɪk/", example: "I have a headache.", exampleEs: "Tengo dolor de cabeza." },
      { word: "Allergy", translation: "Alergia", pronunciation: "/ˈælərdʒi/", example: "I have a food allergy.", exampleEs: "Tengo alergia a la comida." },
      { word: "Exercise", translation: "Ejercicio", pronunciation: "/ˈɛksərsaɪz/", example: "Exercise is good for health.", exampleEs: "El ejercicio es bueno para la salud." },
    ],
  },
  {
    id: 24, name: "Educación", color: "#8E5AF5",
    words: [
      { word: "School", translation: "Escuela", pronunciation: "/skuːl/", example: "I go to school every day.", exampleEs: "Voy a la escuela todos los días." },
      { word: "Class", translation: "Clase", pronunciation: "/klɑːs/", example: "The class starts at 8.", exampleEs: "La clase empieza a las 8." },
      { word: "Homework", translation: "Tarea", pronunciation: "/ˈhoʊmwɜːrk/", example: "I do my homework after school.", exampleEs: "Hago mi tarea después de la escuela." },
      { word: "Exam", translation: "Examen", pronunciation: "/ɪɡˈzæm/", example: "I have an exam tomorrow.", exampleEs: "Tengo un examen mañana." },
      { word: "Grade", translation: "Calificación", pronunciation: "/ɡreɪd/", example: "I got a good grade.", exampleEs: "Obtuve una buena calificación." },
      { word: "Library", translation: "Biblioteca", pronunciation: "/ˈlaɪbrɛri/", example: "I study in the library.", exampleEs: "Estudio en la biblioteca." },
      { word: "Pencil", translation: "Lápiz", pronunciation: "/ˈpɛnsɪl/", example: "Write with a pencil.", exampleEs: "Escribe con un lápiz." },
      { word: "Notebook", translation: "Cuaderno", pronunciation: "/ˈnoʊtbʊk/", example: "Write in your notebook.", exampleEs: "Escribe en tu cuaderno." },
      { word: "University", translation: "Universidad", pronunciation: "/ˌjuːnɪˈvɜːrsɪti/", example: "She studies at university.", exampleEs: "Ella estudia en la universidad." },
      { word: "Diploma", translation: "Diploma", pronunciation: "/dɪˈploʊmə/", example: "He received his diploma.", exampleEs: "Él recibió su diploma." },
    ],
  },
  {
    id: 25, name: "Preposiciones", color: "#FF9600",
    words: [
      { word: "In", translation: "En/Dentro de", pronunciation: "/ɪn/", example: "The cat is in the box.", exampleEs: "El gato está en la caja." },
      { word: "On", translation: "Sobre/Encima de", pronunciation: "/ɒn/", example: "The book is on the table.", exampleEs: "El libro está sobre la mesa." },
      { word: "Under", translation: "Debajo de", pronunciation: "/ˈʌndər/", example: "The dog is under the bed.", exampleEs: "El perro está debajo de la cama." },
      { word: "Next to", translation: "Al lado de", pronunciation: "/nɛkst tuː/", example: "She sits next to me.", exampleEs: "Ella se sienta al lado de mí." },
      { word: "Between", translation: "Entre", pronunciation: "/bɪˈtwiːn/", example: "The shop is between two banks.", exampleEs: "La tienda está entre dos bancos." },
      { word: "Behind", translation: "Detrás de", pronunciation: "/bɪˈhaɪnd/", example: "The car is behind the house.", exampleEs: "El carro está detrás de la casa." },
      { word: "In front of", translation: "Enfrente de", pronunciation: "/ɪn frʌnt ɒv/", example: "Stand in front of me.", exampleEs: "Párate enfrente de mí." },
      { word: "Above", translation: "Sobre/Por encima", pronunciation: "/əˈbʌv/", example: "The plane flies above the clouds.", exampleEs: "El avión vuela sobre las nubes." },
      { word: "Near", translation: "Cerca de", pronunciation: "/nɪər/", example: "The park is near my house.", exampleEs: "El parque está cerca de mi casa." },
      { word: "Far", translation: "Lejos", pronunciation: "/fɑːr/", example: "The school is far from here.", exampleEs: "La escuela está lejos de aquí." },
    ],
  },
  {
    id: 26, name: "Preguntas Clave", color: "#58CC02",
    words: [
      { word: "What", translation: "Qué", pronunciation: "/wɒt/", example: "What is your name?", exampleEs: "¿Cuál es tu nombre?" },
      { word: "Where", translation: "Dónde", pronunciation: "/wɛər/", example: "Where do you live?", exampleEs: "¿Dónde vives?" },
      { word: "When", translation: "Cuándo", pronunciation: "/wɛn/", example: "When is your birthday?", exampleEs: "¿Cuándo es tu cumpleaños?" },
      { word: "Who", translation: "Quién", pronunciation: "/huː/", example: "Who is that person?", exampleEs: "¿Quién es esa persona?" },
      { word: "Why", translation: "Por qué", pronunciation: "/waɪ/", example: "Why are you sad?", exampleEs: "¿Por qué estás triste?" },
      { word: "How", translation: "Cómo", pronunciation: "/haʊ/", example: "How are you?", exampleEs: "¿Cómo estás?" },
      { word: "Which", translation: "Cuál", pronunciation: "/wɪtʃ/", example: "Which color do you like?", exampleEs: "¿Cuál color te gusta?" },
      { word: "How much", translation: "Cuánto", pronunciation: "/haʊ mʌtʃ/", example: "How much does it cost?", exampleEs: "¿Cuánto cuesta?" },
      { word: "How many", translation: "Cuántos", pronunciation: "/haʊ ˈmɛni/", example: "How many apples do you have?", exampleEs: "¿Cuántas manzanas tienes?" },
      { word: "How long", translation: "Cuánto tiempo", pronunciation: "/haʊ lɒŋ/", example: "How long does it take?", exampleEs: "¿Cuánto tiempo toma?" },
    ],
  },
  {
    id: 27, name: "Verbos Avanzados", color: "#1CB0F6",
    words: [
      { word: "Think", translation: "Pensar", pronunciation: "/θɪŋk/", example: "I think you are right.", exampleEs: "Creo que tienes razón." },
      { word: "Feel", translation: "Sentir", pronunciation: "/fiːl/", example: "How do you feel?", exampleEs: "¿Cómo te sientes?" },
      { word: "Know", translation: "Saber/Conocer", pronunciation: "/noʊ/", example: "I know the answer.", exampleEs: "Sé la respuesta." },
      { word: "Want", translation: "Querer", pronunciation: "/wɒnt/", example: "I want to learn English.", exampleEs: "Quiero aprender inglés." },
      { word: "Need", translation: "Necesitar", pronunciation: "/niːd/", example: "I need your help.", exampleEs: "Necesito tu ayuda." },
      { word: "Love", translation: "Amar/Encantar", pronunciation: "/lʌv/", example: "I love my family.", exampleEs: "Amo a mi familia." },
      { word: "Hate", translation: "Odiar", pronunciation: "/heɪt/", example: "I hate waking up early.", exampleEs: "Odio despertarme temprano." },
      { word: "Try", translation: "Intentar", pronunciation: "/traɪ/", example: "Try your best!", exampleEs: "¡Intenta dar lo mejor!" },
      { word: "Understand", translation: "Entender", pronunciation: "/ˌʌndərˈstænd/", example: "Do you understand?", exampleEs: "¿Entiendes?" },
      { word: "Remember", translation: "Recordar", pronunciation: "/rɪˈmɛmbər/", example: "I remember your name.", exampleEs: "Recuerdo tu nombre." },
    ],
  },
  {
    id: 28, name: "Viajes", color: "#FF6D6D",
    words: [
      { word: "Ticket", translation: "Boleto", pronunciation: "/ˈtɪkɪt/", example: "I bought a ticket to New York.", exampleEs: "Compré un boleto a Nueva York." },
      { word: "Passport", translation: "Pasaporte", pronunciation: "/ˈpɑːspɔːrt/", example: "Don't forget your passport.", exampleEs: "No olvides tu pasaporte." },
      { word: "Luggage", translation: "Equipaje", pronunciation: "/ˈlʌɡɪdʒ/", example: "My luggage is too heavy.", exampleEs: "Mi equipaje está muy pesado." },
      { word: "Flight", translation: "Vuelo", pronunciation: "/flaɪt/", example: "The flight takes three hours.", exampleEs: "El vuelo dura tres horas." },
      { word: "Hotel", translation: "Hotel", pronunciation: "/hoʊˈtɛl/", example: "We booked a hotel near the beach.", exampleEs: "Reservamos un hotel cerca de la playa." },
      { word: "Destination", translation: "Destino", pronunciation: "/ˌdɛstɪˈneɪʃən/", example: "What is your destination?", exampleEs: "¿Cuál es tu destino?" },
      { word: "Tourist", translation: "Turista", pronunciation: "/ˈtʊərɪst/", example: "Many tourists visit this city.", exampleEs: "Muchos turistas visitan esta ciudad." },
      { word: "Guide", translation: "Guía", pronunciation: "/ɡaɪd/", example: "The guide showed us the museum.", exampleEs: "El guía nos mostró el museo." },
      { word: "Trip", translation: "Viaje", pronunciation: "/trɪp/", example: "We had a great trip!", exampleEs: "¡Tuvimos un viaje increíble!" },
      { word: "Vacation", translation: "Vacaciones", pronunciation: "/veɪˈkeɪʃən/", example: "I need a vacation.", exampleEs: "Necesito unas vacaciones." },
    ],
  },
  {
    id: 29, name: "El Trabajo", color: "#8E5AF5",
    words: [
      { word: "Job", translation: "Trabajo", pronunciation: "/dʒɒb/", example: "I have a new job.", exampleEs: "Tengo un trabajo nuevo." },
      { word: "Office", translation: "Oficina", pronunciation: "/ˈɒfɪs/", example: "She works in a big office.", exampleEs: "Ella trabaja en una oficina grande." },
      { word: "Meeting", translation: "Reunión", pronunciation: "/ˈmiːtɪŋ/", example: "We have a meeting at 10.", exampleEs: "Tenemos una reunión a las 10." },
      { word: "Boss", translation: "Jefe", pronunciation: "/bɒs/", example: "My boss is very strict.", exampleEs: "Mi jefe es muy estricto." },
      { word: "Colleague", translation: "Colega", pronunciation: "/ˈkɒliːɡ/", example: "My colleague helped me a lot.", exampleEs: "Mi colega me ayudó mucho." },
      { word: "Salary", translation: "Salario", pronunciation: "/ˈsæləri/", example: "I got a salary raise.", exampleEs: "Me dieron un aumento de salario." },
      { word: "Contract", translation: "Contrato", pronunciation: "/ˈkɒntrækt/", example: "Sign the contract here.", exampleEs: "Firma el contrato aquí." },
      { word: "Resume", translation: "Currículum", pronunciation: "/ˈrɛzjuːmeɪ/", example: "Send your resume by email.", exampleEs: "Envía tu currículum por correo." },
      { word: "Interview", translation: "Entrevista", pronunciation: "/ˈɪntərvjuː/", example: "I have a job interview tomorrow.", exampleEs: "Tengo una entrevista de trabajo mañana." },
      { word: "Promotion", translation: "Ascenso", pronunciation: "/prəˈmoʊʃən/", example: "She got a promotion!", exampleEs: "¡Ella recibió un ascenso!" },
    ],
  },
  {
    id: 30, name: "Frases del Día a Día", color: "#FF9600",
    words: [
      { word: "Good morning", translation: "Buenos días", pronunciation: "/ɡʊd ˈmɔːrnɪŋ/", example: "Good morning, how are you?", exampleEs: "Buenos días, ¿cómo estás?" },
      { word: "Good night", translation: "Buenas noches", pronunciation: "/ɡʊd naɪt/", example: "Good night, sleep well.", exampleEs: "Buenas noches, duerme bien." },
      { word: "How are you", translation: "¿Cómo estás?", pronunciation: "/haʊ ɑːr juː/", example: "How are you today?", exampleEs: "¿Cómo estás hoy?" },
      { word: "I'm fine", translation: "Estoy bien", pronunciation: "/aɪm faɪn/", example: "I'm fine, thank you.", exampleEs: "Estoy bien, gracias." },
      { word: "See you later", translation: "Hasta luego", pronunciation: "/siː juː ˈleɪtər/", example: "See you later, friend!", exampleEs: "¡Hasta luego, amigo!" },
      { word: "Excuse me", translation: "Disculpe", pronunciation: "/ɪkˈskjuːz miː/", example: "Excuse me, where is the bathroom?", exampleEs: "Disculpe, ¿dónde está el baño?" },
      { word: "I don't understand", translation: "No entiendo", pronunciation: "/aɪ doʊnt ˌʌndərˈstænd/", example: "I don't understand. Can you repeat?", exampleEs: "No entiendo. ¿Puede repetir?" },
      { word: "Can you help me", translation: "¿Me puede ayudar?", pronunciation: "/kæn juː hɛlp miː/", example: "Can you help me, please?", exampleEs: "¿Me puede ayudar, por favor?" },
      { word: "What time is it", translation: "¿Qué hora es?", pronunciation: "/wɒt taɪm ɪz ɪt/", example: "Excuse me, what time is it?", exampleEs: "Disculpe, ¿qué hora es?" },
      { word: "Nice to meet you", translation: "Mucho gusto", pronunciation: "/naɪs tuː miːt juː/", example: "Nice to meet you, I'm Carlos.", exampleEs: "Mucho gusto, soy Carlos." },
    ],
  },
];

export function getAllWords(): Word[] {
  return LESSONS.flatMap(l => l.words);
}

export function getLevelData(levelNum: number) {
  const baseXP = 10;
  const xp = Math.min(baseXP + Math.floor(levelNum / 10), 50);
  if (levelNum <= 30) {
    return { ...LESSONS[levelNum - 1], xp };
  }
  const lessonIndex = (levelNum - 1) % 30;
  const base = LESSONS[lessonIndex];
  const cycle = Math.floor((levelNum - 1) / 30);
  const suffixes = ['', ' II', ' III', ' IV', ' V', ' VI', ' VII', ' VIII', ' IX', ' X',
                    ' XI', ' XII', ' XIII', ' XIV', ' XV', ' XVI', ' XVII'];
  return {
    id: levelNum,
    name: base.name + (suffixes[cycle] || ` ${cycle + 1}`),
    words: base.words,
    color: base.color,
    xp,
  };
}

export function getLevelIcon(level: number): string {
  const icons = ['📖','💬','📝','🎯','⭐','🏆','💡','🔤','📚','✏️',
                 '🌟','🚀','💪','🎨','🌈','🔬','🏅','🎓','💼','🌍',
                 '🎭','🎪','🎡','🎢','🎠','🏰','🌉','🗽','🎌','🏝️'];
  return icons[(level - 1) % icons.length];
}

export function getTodayKey(): string {
  const today = new Date();
  return `${today.getFullYear()}-${today.getMonth() + 1}-${today.getDate()}`;
}

export function getDailyWords(): Word[] {
  const today = new Date();
  const dayOfYear = Math.floor((today.getTime() - new Date(today.getFullYear(), 0, 0).getTime()) / (1000 * 60 * 60 * 24));
  const startLesson = dayOfYear % 30;
  const dailyWords: Word[] = [];
  for (let i = 0; i < 3; i++) {
    const lessonIndex = (startLesson + i) % 30;
    dailyWords.push(...LESSONS[lessonIndex].words);
  }
  return dailyWords.slice(0, 30);
}
