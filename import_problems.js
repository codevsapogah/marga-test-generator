// Script to import 39 7th grade math problems via API

const problems = [
    {
        textRu: 'Найдите значение x: 3x - 7 = 14',
        textKz: 'x мәнін табыңыз: 3x - 7 = 14',
        textEn: 'Find x: 3x - 7 = 14',
        correctAnswer: 'x = 7',
        wrongAnswers: ['x = 5', 'x = 8', 'x = 6'],
        classLevel: 7,
        difficulty: 'easy',
        quarter: 2,
        tags: ['algebra', 'linear_equations'],
        formula: '3x - 7 = 14'
    },
    {
        textRu: 'Найдите 25% от 80',
        textKz: '80-нің 25% табыңыз',
        textEn: 'Find 25% of 80',
        correctAnswer: '20',
        wrongAnswers: ['15', '25', '30'],
        classLevel: 7,
        difficulty: 'easy',
        quarter: 2,
        tags: ['percentage', 'arithmetic'],
        formula: '25% × 80'
    },
    {
        textRu: 'Прямоугольник имеет длину 12 см и ширину 5 см. Найдите его площадь.',
        textKz: 'Тік төртбұрыштың ұзындығы 12 см, ені 5 см. Ауданын табыңыз.',
        textEn: 'A rectangle has length 12 cm and width 5 cm. Find its area.',
        correctAnswer: '60 см²',
        wrongAnswers: ['34 см²', '17 см²', '50 см²'],
        classLevel: 7,
        difficulty: 'easy',
        quarter: 2,
        tags: ['geometry', 'area'],
        formula: 'S = a × b'
    },
    {
        textRu: 'Вычислите: 2/5 + 1/5',
        textKz: 'Есептеңіз: 2/5 + 1/5',
        textEn: 'Calculate: 2/5 + 1/5',
        correctAnswer: '3/5',
        wrongAnswers: ['2/5', '3/10', '1/5'],
        classLevel: 7,
        difficulty: 'easy',
        quarter: 2,
        tags: ['fractions', 'arithmetic'],
        formula: '2/5 + 1/5'
    },
    {
        textRu: 'Вычислите: -8 + 15',
        textKz: 'Есептеңіз: -8 + 15',
        textEn: 'Calculate: -8 + 15',
        correctAnswer: '7',
        wrongAnswers: ['-7', '23', '-23'],
        classLevel: 7,
        difficulty: 'easy',
        quarter: 2,
        tags: ['integers', 'arithmetic'],
        formula: '-8 + 15'
    },
    {
        textRu: 'Найдите периметр квадрата со стороной 9 см',
        textKz: '9 см қабырғасы бар шаршының периметрін табыңыз',
        textEn: 'Find the perimeter of a square with side 9 cm',
        correctAnswer: '36 см',
        wrongAnswers: ['81 см', '18 см', '27 см'],
        classLevel: 7,
        difficulty: 'easy',
        quarter: 2,
        tags: ['geometry', 'perimeter'],
        formula: 'P = 4a'
    },
    {
        textRu: 'Соотношение мальчиков к девочкам в классе 3:2. Если всего 30 учеников, сколько мальчиков?',
        textKz: 'Сыныптағы ұлдар мен қыздардың қатынасы 3:2. Барлығы 30 оқушы болса, ұлдар саны қанша?',
        textEn: 'The ratio of boys to girls in a class is 3:2. If there are 30 students total, how many boys?',
        correctAnswer: '18',
        wrongAnswers: ['12', '15', '20'],
        classLevel: 7,
        difficulty: 'medium',
        quarter: 2,
        tags: ['ratios', 'proportions'],
        formula: '3:2, сумма = 30'
    },
    {
        textRu: 'Решите уравнение: 4x + 9 = 29',
        textKz: 'Теңдеуді шешіңіз: 4x + 9 = 29',
        textEn: 'Solve: 4x + 9 = 29',
        correctAnswer: 'x = 5',
        wrongAnswers: ['x = 4', 'x = 7', 'x = 6'],
        classLevel: 7,
        difficulty: 'medium',
        quarter: 2,
        tags: ['algebra', 'linear_equations'],
        formula: '4x + 9 = 29'
    },
    {
        textRu: 'Вычислите: 3.5 × 4',
        textKz: 'Есептеңіз: 3.5 × 4',
        textEn: 'Calculate: 3.5 × 4',
        correctAnswer: '14',
        wrongAnswers: ['12', '15', '14.5'],
        classLevel: 7,
        difficulty: 'easy',
        quarter: 2,
        tags: ['decimals', 'arithmetic'],
        formula: '3.5 × 4'
    },
    {
        textRu: 'В треугольнике два угла равны 45° и 65°. Найдите третий угол.',
        textKz: 'Үшбұрыштың екі бұрышы 45° және 65°. Үшінші бұрышты табыңыз.',
        textEn: 'In a triangle, two angles are 45° and 65°. Find the third angle.',
        correctAnswer: '70°',
        wrongAnswers: ['80°', '60°', '75°'],
        classLevel: 7,
        difficulty: 'medium',
        quarter: 2,
        tags: ['geometry', 'angles'],
        formula: '180° - 45° - 65°'
    },
    {
        textRu: 'Цена товара была 200 тенге, а стала 250 тенге. На сколько процентов увеличилась цена?',
        textKz: 'Тауардың бағасы 200 теңге болды, ал 250 теңге болды. Баға неше пайызға өсті?',
        textEn: 'Price was 200 tenge, became 250 tenge. By what percentage did it increase?',
        correctAnswer: '25%',
        wrongAnswers: ['50%', '20%', '30%'],
        classLevel: 7,
        difficulty: 'medium',
        quarter: 2,
        tags: ['percentage', 'word_problems'],
        formula: '(250-200)/200 × 100%'
    },
    {
        textRu: 'Вычислите: 7/8 - 3/8',
        textKz: 'Есептеңіз: 7/8 - 3/8',
        textEn: 'Calculate: 7/8 - 3/8',
        correctAnswer: '1/2',
        wrongAnswers: ['4/8', '10/8', '4/16'],
        classLevel: 7,
        difficulty: 'easy',
        quarter: 2,
        tags: ['fractions', 'arithmetic'],
        formula: '7/8 - 3/8'
    },
    {
        textRu: 'Вычислите: 5 + 3 × 4',
        textKz: 'Есептеңіз: 5 + 3 × 4',
        textEn: 'Calculate: 5 + 3 × 4',
        correctAnswer: '17',
        wrongAnswers: ['32', '20', '29'],
        classLevel: 7,
        difficulty: 'medium',
        quarter: 2,
        tags: ['order_of_operations', 'arithmetic'],
        formula: '5 + 3 × 4'
    },
    {
        textRu: 'Площадь треугольника с основанием 10 см и высотой 6 см равна:',
        textKz: 'Табаны 10 см, биіктігі 6 см үшбұрыштың ауданы:',
        textEn: 'The area of a triangle with base 10 cm and height 6 cm is:',
        correctAnswer: '30 см²',
        wrongAnswers: ['60 см²', '16 см²', '20 см²'],
        classLevel: 7,
        difficulty: 'medium',
        quarter: 2,
        tags: ['geometry', 'area'],
        formula: 'S = (b × h)/2'
    },
    {
        textRu: 'Упростите: 5x + 3x',
        textKz: 'Жеңілдетіңіз: 5x + 3x',
        textEn: 'Simplify: 5x + 3x',
        correctAnswer: '8x',
        wrongAnswers: ['8x²', '15x', '2x'],
        classLevel: 7,
        difficulty: 'easy',
        quarter: 2,
        tags: ['algebra', 'simplification'],
        formula: '5x + 3x'
    },
    {
        textRu: 'Вычислите: -6 × 4',
        textKz: 'Есептеңіз: -6 × 4',
        textEn: 'Calculate: -6 × 4',
        correctAnswer: '-24',
        wrongAnswers: ['24', '-10', '-2'],
        classLevel: 7,
        difficulty: 'easy',
        quarter: 2,
        tags: ['integers', 'arithmetic'],
        formula: '-6 × 4'
    },
    {
        textRu: 'Решите пропорцию: x/12 = 3/4',
        textKz: 'Пропорцияны шешіңіз: x/12 = 3/4',
        textEn: 'Solve the proportion: x/12 = 3/4',
        correctAnswer: 'x = 9',
        wrongAnswers: ['x = 16', 'x = 8', 'x = 10'],
        classLevel: 7,
        difficulty: 'medium',
        quarter: 2,
        tags: ['proportions', 'algebra'],
        formula: 'x/12 = 3/4'
    },
    {
        textRu: 'Найдите длину окружности с радиусом 7 см (π ≈ 3.14)',
        textKz: 'Радиусы 7 см шеңбердің ұзындығын табыңыз (π ≈ 3.14)',
        textEn: 'Find the circumference of a circle with radius 7 cm (π ≈ 3.14)',
        correctAnswer: '43.96 см',
        wrongAnswers: ['21.98 см', '153.86 см', '14 см'],
        classLevel: 7,
        difficulty: 'medium',
        quarter: 2,
        tags: ['geometry', 'circles'],
        formula: 'C = 2πr'
    },
    {
        textRu: 'Найдите среднее арифметическое чисел: 8, 12, 15, 9',
        textKz: 'Сандардың арифметикалық ортасын табыңыз: 8, 12, 15, 9',
        textEn: 'Find the mean of: 8, 12, 15, 9',
        correctAnswer: '11',
        wrongAnswers: ['10', '12', '13'],
        classLevel: 7,
        difficulty: 'easy',
        quarter: 2,
        tags: ['statistics', 'mean'],
        formula: '(8+12+15+9)/4'
    },
    {
        textRu: 'Вычислите: 2/3 × 3/4',
        textKz: 'Есептеңіз: 2/3 × 3/4',
        textEn: 'Calculate: 2/3 × 3/4',
        correctAnswer: '1/2',
        wrongAnswers: ['2/3', '5/7', '6/12'],
        classLevel: 7,
        difficulty: 'medium',
        quarter: 2,
        tags: ['fractions', 'arithmetic'],
        formula: '2/3 × 3/4'
    },
    {
        textRu: 'Решите неравенство: x + 5 > 12',
        textKz: 'Теңсіздікті шешіңіз: x + 5 > 12',
        textEn: 'Solve the inequality: x + 5 > 12',
        correctAnswer: 'x > 7',
        wrongAnswers: ['x > 17', 'x < 7', 'x > 5'],
        classLevel: 7,
        difficulty: 'medium',
        quarter: 2,
        tags: ['inequalities', 'algebra'],
        formula: 'x + 5 > 12'
    },
    {
        textRu: 'Вычислите: 8.4 ÷ 4',
        textKz: 'Есептеңіз: 8.4 ÷ 4',
        textEn: 'Calculate: 8.4 ÷ 4',
        correctAnswer: '2.1',
        wrongAnswers: ['2.4', '3.1', '1.9'],
        classLevel: 7,
        difficulty: 'easy',
        quarter: 2,
        tags: ['decimals', 'arithmetic'],
        formula: '8.4 ÷ 4'
    },
    {
        textRu: 'Найдите объем куба с ребром 5 см',
        textKz: 'Қыры 5 см текшенің көлемін табыңыз',
        textEn: 'Find the volume of a cube with edge 5 cm',
        correctAnswer: '125 см³',
        wrongAnswers: ['25 см³', '75 см³', '100 см³'],
        classLevel: 7,
        difficulty: 'medium',
        quarter: 2,
        tags: ['geometry', 'volume'],
        formula: 'V = a³'
    },
    {
        textRu: 'Вычислите: 2⁴',
        textKz: 'Есептеңіз: 2⁴',
        textEn: 'Calculate: 2⁴',
        correctAnswer: '16',
        wrongAnswers: ['8', '32', '12'],
        classLevel: 7,
        difficulty: 'easy',
        quarter: 2,
        tags: ['exponents', 'arithmetic'],
        formula: '2⁴'
    },
    {
        textRu: 'Упростите: 3(x + 4)',
        textKz: 'Жеңілдетіңіз: 3(x + 4)',
        textEn: 'Simplify: 3(x + 4)',
        correctAnswer: '3x + 12',
        wrongAnswers: ['3x + 4', 'x + 12', '4x + 3'],
        classLevel: 7,
        difficulty: 'medium',
        quarter: 2,
        tags: ['algebra', 'distributive'],
        formula: '3(x + 4)'
    },
    {
        textRu: 'Два угла являются дополнительными. Если один угол равен 35°, чему равен другой?',
        textKz: 'Екі бұрыш қосымша. Бір бұрыш 35° болса, екіншісі неше градус?',
        textEn: 'Two angles are complementary. If one is 35°, what is the other?',
        correctAnswer: '55°',
        wrongAnswers: ['145°', '65°', '45°'],
        classLevel: 7,
        difficulty: 'easy',
        quarter: 2,
        tags: ['geometry', 'angles'],
        formula: '90° - 35°'
    },
    {
        textRu: 'Машина проехала 180 км за 3 часа. Какова её средняя скорость?',
        textKz: 'Көлік 3 сағатта 180 км жүрді. Оның орташа жылдамдығы қандай?',
        textEn: 'A car traveled 180 km in 3 hours. What is its average speed?',
        correctAnswer: '60 км/ч',
        wrongAnswers: ['183 км/ч', '177 км/ч', '540 км/ч'],
        classLevel: 7,
        difficulty: 'medium',
        quarter: 2,
        tags: ['word_problems', 'speed'],
        formula: 'v = s/t'
    },
    {
        textRu: 'Какая дробь больше: 3/5 или 2/3?',
        textKz: 'Қай бөлшек үлкен: 3/5 немесе 2/3?',
        textEn: 'Which fraction is larger: 3/5 or 2/3?',
        correctAnswer: '2/3',
        wrongAnswers: ['3/5', 'Они равны', 'Нельзя сравнить'],
        classLevel: 7,
        difficulty: 'medium',
        quarter: 2,
        tags: ['fractions', 'comparison'],
        formula: '3/5 = 0.6, 2/3 ≈ 0.67'
    },
    {
        textRu: 'Найдите: |-15|',
        textKz: 'Табыңыз: |-15|',
        textEn: 'Find: |-15|',
        correctAnswer: '15',
        wrongAnswers: ['-15', '0', '30'],
        classLevel: 7,
        difficulty: 'easy',
        quarter: 2,
        tags: ['integers', 'absolute_value'],
        formula: '|-15|'
    },
    {
        textRu: 'Решите уравнение: x/3 = 5',
        textKz: 'Теңдеуді шешіңіз: x/3 = 5',
        textEn: 'Solve: x/3 = 5',
        correctAnswer: 'x = 15',
        wrongAnswers: ['x = 5/3', 'x = 8', 'x = 2'],
        classLevel: 7,
        difficulty: 'easy',
        quarter: 2,
        tags: ['algebra', 'linear_equations'],
        formula: 'x/3 = 5'
    },
    {
        textRu: 'Сколько процентов составляет 15 от 60?',
        textKz: '15 санының 60-қа қатынасы неше пайыз?',
        textEn: 'What percentage is 15 of 60?',
        correctAnswer: '25%',
        wrongAnswers: ['15%', '4%', '20%'],
        classLevel: 7,
        difficulty: 'medium',
        quarter: 2,
        tags: ['percentage', 'arithmetic'],
        formula: '(15/60) × 100%'
    },
    {
        textRu: 'При пересечении двух параллельных прямых секущей соответственные углы равны. Если один угол 110°, чему равен соответственный угол?',
        textKz: 'Екі параллель түзуді қиюшы қиғанда сәйкес бұрыштар тең. Бір бұрыш 110° болса, сәйкес бұрыш неше градус?',
        textEn: 'When parallel lines are cut by a transversal, corresponding angles are equal. If one is 110°, what is the corresponding angle?',
        correctAnswer: '110°',
        wrongAnswers: ['70°', '180°', '90°'],
        classLevel: 7,
        difficulty: 'hard',
        quarter: 2,
        tags: ['geometry', 'parallel_lines'],
        formula: null
    },
    {
        textRu: 'Запишите число 5000 в научной нотации',
        textKz: '5000 санын ғылыми түрде жазыңыз',
        textEn: 'Write 5000 in scientific notation',
        correctAnswer: '5 × 10³',
        wrongAnswers: ['5 × 10⁴', '50 × 10²', '0.5 × 10⁴'],
        classLevel: 7,
        difficulty: 'hard',
        quarter: 2,
        tags: ['scientific_notation', 'arithmetic'],
        formula: '5000 = 5 × 10³'
    },
    {
        textRu: 'Найдите: √64',
        textKz: 'Табыңыз: √64',
        textEn: 'Find: √64',
        correctAnswer: '8',
        wrongAnswers: ['32', '4', '16'],
        classLevel: 7,
        difficulty: 'easy',
        quarter: 2,
        tags: ['square_roots', 'arithmetic'],
        formula: '√64'
    },
    {
        textRu: 'Упростите: 4x + 7 - 2x + 3',
        textKz: 'Жеңілдетіңіз: 4x + 7 - 2x + 3',
        textEn: 'Simplify: 4x + 7 - 2x + 3',
        correctAnswer: '2x + 10',
        wrongAnswers: ['6x + 10', '2x + 4', '4x + 10'],
        classLevel: 7,
        difficulty: 'medium',
        quarter: 2,
        tags: ['algebra', 'simplification'],
        formula: '4x + 7 - 2x + 3'
    },
    {
        textRu: 'На карте 1 см соответствует 5 км. Если расстояние на карте 8 см, каково реальное расстояние?',
        textKz: 'Картада 1 см 5 км-ге сәйкес келеді. Картадағы қашықтық 8 см болса, нақты қашықтық қандай?',
        textEn: 'On a map, 1 cm represents 5 km. If the distance on the map is 8 cm, what is the actual distance?',
        correctAnswer: '40 км',
        wrongAnswers: ['13 км', '3 км', '8 км'],
        classLevel: 7,
        difficulty: 'medium',
        quarter: 2,
        tags: ['ratios', 'word_problems'],
        formula: '8 × 5'
    },
    {
        textRu: 'Найдите медиану набора чисел: 3, 7, 9, 15, 20',
        textKz: 'Сандар жиынының медианасын табыңыз: 3, 7, 9, 15, 20',
        textEn: 'Find the median of: 3, 7, 9, 15, 20',
        correctAnswer: '9',
        wrongAnswers: ['10.8', '7', '15'],
        classLevel: 7,
        difficulty: 'medium',
        quarter: 2,
        tags: ['statistics', 'median'],
        formula: null
    },
    {
        textRu: 'Найдите площадь поверхности куба с ребром 4 см',
        textKz: 'Қыры 4 см текшенің бетінің ауданын табыңыз',
        textEn: 'Find the surface area of a cube with edge 4 cm',
        correctAnswer: '96 см²',
        wrongAnswers: ['64 см²', '16 см²', '24 см²'],
        classLevel: 7,
        difficulty: 'hard',
        quarter: 2,
        tags: ['geometry', 'surface_area'],
        formula: 'SA = 6a²'
    },
    {
        textRu: 'Вычислите: -24 ÷ (-6)',
        textKz: 'Есептеңіз: -24 ÷ (-6)',
        textEn: 'Calculate: -24 ÷ (-6)',
        correctAnswer: '4',
        wrongAnswers: ['-4', '-30', '30'],
        classLevel: 7,
        difficulty: 'easy',
        quarter: 2,
        tags: ['integers', 'arithmetic'],
        formula: '-24 ÷ (-6)'
    }
];

async function importProblems() {
    console.log('Starting import of 39 problems...\n');

    for (let i = 0; i < problems.length; i++) {
        const problem = problems[i];

        try {
            const response = await fetch('http://localhost:3000/api/problems', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(problem)
            });

            const text = await response.text();
            let result;

            try {
                result = JSON.parse(text);
            } catch (e) {
                console.error(`❌ Problem ${i + 2} - Invalid JSON response:`, text.substring(0, 100));
                continue;
            }

            if (result.success) {
                console.log(`✅ Problem ${i + 2} imported successfully (ID: ${result.problemId})`);
            } else {
                console.error(`❌ Problem ${i + 2} failed:`, result.message);
            }
        } catch (error) {
            console.error(`❌ Problem ${i + 2} error:`, error.message);
        }

        // Small delay to avoid overwhelming the server
        await new Promise(resolve => setTimeout(resolve, 100));
    }

    console.log('\n✅ Import completed!');
}

importProblems().catch(console.error);
