export interface GameWord {
  word: string;       // inglés
  translation: string; // español
  category: string;
}

export const GAME_WORDS: GameWord[] = [
  // Colores
  { word: 'Red', translation: 'Rojo', category: 'colors' },
  { word: 'Blue', translation: 'Azul', category: 'colors' },
  { word: 'Green', translation: 'Verde', category: 'colors' },
  { word: 'Yellow', translation: 'Amarillo', category: 'colors' },
  { word: 'Orange', translation: 'Naranja', category: 'colors' },
  { word: 'Purple', translation: 'Morado', category: 'colors' },
  { word: 'White', translation: 'Blanco', category: 'colors' },
  { word: 'Black', translation: 'Negro', category: 'colors' },
  { word: 'Pink', translation: 'Rosado', category: 'colors' },
  { word: 'Brown', translation: 'Café', category: 'colors' },

  // Números
  { word: 'One', translation: 'Uno', category: 'numbers' },
  { word: 'Two', translation: 'Dos', category: 'numbers' },
  { word: 'Three', translation: 'Tres', category: 'numbers' },
  { word: 'Four', translation: 'Cuatro', category: 'numbers' },
  { word: 'Five', translation: 'Cinco', category: 'numbers' },
  { word: 'Six', translation: 'Seis', category: 'numbers' },
  { word: 'Seven', translation: 'Siete', category: 'numbers' },
  { word: 'Eight', translation: 'Ocho', category: 'numbers' },
  { word: 'Nine', translation: 'Nueve', category: 'numbers' },
  { word: 'Ten', translation: 'Diez', category: 'numbers' },

  // Animales
  { word: 'Dog', translation: 'Perro', category: 'animals' },
  { word: 'Cat', translation: 'Gato', category: 'animals' },
  { word: 'Bird', translation: 'Pájaro', category: 'animals' },
  { word: 'Fish', translation: 'Pez', category: 'animals' },
  { word: 'Horse', translation: 'Caballo', category: 'animals' },
  { word: 'Cow', translation: 'Vaca', category: 'animals' },
  { word: 'Pig', translation: 'Cerdo', category: 'animals' },
  { word: 'Rabbit', translation: 'Conejo', category: 'animals' },
  { word: 'Lion', translation: 'León', category: 'animals' },
  { word: 'Tiger', translation: 'Tigre', category: 'animals' },
  { word: 'Elephant', translation: 'Elefante', category: 'animals' },
  { word: 'Monkey', translation: 'Mono', category: 'animals' },

  // Saludos y frases básicas
  { word: 'Hello', translation: 'Hola', category: 'greetings' },
  { word: 'Goodbye', translation: 'Adiós', category: 'greetings' },
  { word: 'Please', translation: 'Por favor', category: 'greetings' },
  { word: 'Thank you', translation: 'Gracias', category: 'greetings' },
  { word: 'Sorry', translation: 'Lo siento', category: 'greetings' },
  { word: 'Yes', translation: 'Sí', category: 'greetings' },
  { word: 'No', translation: 'No', category: 'greetings' },
  { word: 'Good morning', translation: 'Buenos días', category: 'greetings' },
  { word: 'Good night', translation: 'Buenas noches', category: 'greetings' },
  { word: 'Welcome', translation: 'Bienvenido', category: 'greetings' },

  // Partes de la casa
  { word: 'Door', translation: 'Puerta', category: 'house' },
  { word: 'Window', translation: 'Ventana', category: 'house' },
  { word: 'Bed', translation: 'Cama', category: 'house' },
  { word: 'Chair', translation: 'Silla', category: 'house' },
  { word: 'Table', translation: 'Mesa', category: 'house' },
  { word: 'Sofa', translation: 'Sofá', category: 'house' },
  { word: 'Floor', translation: 'Piso', category: 'house' },
  { word: 'Roof', translation: 'Techo', category: 'house' },
  { word: 'Wall', translation: 'Pared', category: 'house' },
  { word: 'Stairs', translation: 'Escaleras', category: 'house' },
  { word: 'Bathroom', translation: 'Baño', category: 'house' },
  { word: 'Kitchen', translation: 'Cocina', category: 'house' },
  { word: 'Bedroom', translation: 'Dormitorio', category: 'house' },
  { word: 'Garden', translation: 'Jardín', category: 'house' },

  // Cocina
  { word: 'Cup', translation: 'Taza', category: 'kitchen' },
  { word: 'Plate', translation: 'Plato', category: 'kitchen' },
  { word: 'Fork', translation: 'Tenedor', category: 'kitchen' },
  { word: 'Knife', translation: 'Cuchillo', category: 'kitchen' },
  { word: 'Spoon', translation: 'Cuchara', category: 'kitchen' },
  { word: 'Glass', translation: 'Vaso', category: 'kitchen' },
  { word: 'Pot', translation: 'Olla', category: 'kitchen' },
  { word: 'Pan', translation: 'Sartén', category: 'kitchen' },
  { word: 'Fridge', translation: 'Nevera', category: 'kitchen' },
  { word: 'Oven', translation: 'Horno', category: 'kitchen' },
  { word: 'Sink', translation: 'Fregadero', category: 'kitchen' },
  { word: 'Bottle', translation: 'Botella', category: 'kitchen' },

  // Útiles escolares / estudio
  { word: 'Pencil', translation: 'Lápiz', category: 'school' },
  { word: 'Pen', translation: 'Bolígrafo', category: 'school' },
  { word: 'Book', translation: 'Libro', category: 'school' },
  { word: 'Notebook', translation: 'Cuaderno', category: 'school' },
  { word: 'Eraser', translation: 'Borrador', category: 'school' },
  { word: 'Ruler', translation: 'Regla', category: 'school' },
  { word: 'Scissors', translation: 'Tijeras', category: 'school' },
  { word: 'Backpack', translation: 'Mochila', category: 'school' },
  { word: 'Desk', translation: 'Escritorio', category: 'school' },
  { word: 'Chalk', translation: 'Tiza', category: 'school' },
  { word: 'Glue', translation: 'Pegamento', category: 'school' },
  { word: 'Paper', translation: 'Papel', category: 'school' },
];

export const GAME_CATEGORIES: Record<string, { label: string; emoji: string }> = {
  colors: { label: 'Colores', emoji: '🎨' },
  numbers: { label: 'Números', emoji: '🔢' },
  animals: { label: 'Animales', emoji: '🐾' },
  greetings: { label: 'Saludos', emoji: '👋' },
  house: { label: 'La Casa', emoji: '🏠' },
  kitchen: { label: 'Cocina', emoji: '🍳' },
  school: { label: 'Escuela', emoji: '✏️' },
};

export function getGameWordsByCategory(category: string, count = 6): GameWord[] {
  const filtered = GAME_WORDS.filter(w => w.category === category);
  const shuffled = [...filtered].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, Math.min(count, filtered.length));
}

export function getRandomGameWords(count = 6): GameWord[] {
  const shuffled = [...GAME_WORDS].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, count);
}

export function getAllCategories(): string[] {
  return Object.keys(GAME_CATEGORIES);
}
