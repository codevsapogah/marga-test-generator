-- 39 additional 7th grade math problems

-- Problem 2: Simple equation
INSERT INTO math_problems (id, problem_text_ru, problem_text_kz, problem_text_en,
    correct_answer, answer_option_2, answer_option_3, answer_option_4,
    formula, problem_image_url, solution_text, solution_image_url,
    class_level, difficulty_level, curriculum_month, curriculum_quarter, usage_count,
    created_at, updated_at) VALUES (
    'prob-002',
    'Найдите значение x: 3x - 7 = 14',
    'x мәнін табыңыз: 3x - 7 = 14',
    'Find x: 3x - 7 = 14',
    'x = 7',
    'x = 5',
    'x = 8',
    'x = 6',
    '3x - 7 = 14',
    NULL, NULL, NULL,
    7, 'easy', 11, 2, 0,
    NOW(), NOW()
);
INSERT INTO problem_tags (problem_id, tag_name) VALUES ('prob-002', 'algebra'), ('prob-002', 'linear_equations');

-- Problem 3: Percentage
INSERT INTO math_problems VALUES (
    'prob-003',
    'Найдите 25% от 80',
    '80-нің 25% табыңыз',
    'Find 25% of 80',
    '20',
    '15',
    '25',
    '30',
    '25% × 80',
    NULL, NULL, NULL,
    7, 'easy', 11, 2, 0,
    NOW(), NOW()
);
INSERT INTO problem_tags (problem_id, tag_name) VALUES ('prob-003', 'percentage'), ('prob-003', 'arithmetic');

-- Problem 4: Area of rectangle
INSERT INTO math_problems VALUES (
    'prob-004',
    'Прямоугольник имеет длину 12 см и ширину 5 см. Найдите его площадь.',
    'Тік төртбұрыштың ұзындығы 12 см, ені 5 см. Ауданын табыңыз.',
    'A rectangle has length 12 cm and width 5 cm. Find its area.',
    '60 см²',
    '34 см²',
    '17 см²',
    '50 см²',
    'S = a × b',
    NULL, NULL, NULL,
    7, 'easy', 11, 2, 0,
    NOW(), NOW()
);
INSERT INTO problem_tags (problem_id, tag_name) VALUES ('prob-004', 'geometry'), ('prob-004', 'area');

-- Problem 5: Fraction addition
INSERT INTO math_problems VALUES (
    'prob-005',
    'Вычислите: 2/5 + 1/5',
    'Есептеңіз: 2/5 + 1/5',
    'Calculate: 2/5 + 1/5',
    '3/5',
    '2/5',
    '3/10',
    '1/5',
    '2/5 + 1/5',
    NULL, NULL, NULL,
    7, 'easy', 11, 2, 0,
    NOW(), NOW()
);
INSERT INTO problem_tags (problem_id, tag_name) VALUES ('prob-005', 'fractions'), ('prob-005', 'arithmetic');

-- Problem 6: Integer operations
INSERT INTO math_problems VALUES (
    'prob-006',
    'Вычислите: -8 + 15',
    'Есептеңіз: -8 + 15',
    'Calculate: -8 + 15',
    '7',
    '-7',
    '23',
    '-23',
    '-8 + 15',
    NULL, NULL, NULL,
    7, 'easy', 11, 2, 0,
    NOW(), NOW()
);
INSERT INTO problem_tags (problem_id, tag_name) VALUES ('prob-006', 'integers'), ('prob-006', 'arithmetic');

-- Problem 7: Perimeter
INSERT INTO math_problems VALUES (
    'prob-007',
    'Найдите периметр квадрата со стороной 9 см',
    '9 см қабырғасы бар шаршының периметрін табыңыз',
    'Find the perimeter of a square with side 9 cm',
    '36 см',
    '81 см',
    '18 см',
    '27 см',
    'P = 4a',
    NULL, NULL, NULL,
    7, 'easy', 11, 2, 0,
    NOW(), NOW()
);
INSERT INTO problem_tags (problem_id, tag_name) VALUES ('prob-007', 'geometry'), ('prob-007', 'perimeter');

-- Problem 8: Ratio
INSERT INTO math_problems VALUES (
    'prob-008',
    'Соотношение мальчиков к девочкам в классе 3:2. Если всего 30 учеников, сколько мальчиков?',
    'Сыныптағы ұлдар мен қыздардың қатынасы 3:2. Барлығы 30 оқушы болса, ұлдар саны қанша?',
    'The ratio of boys to girls in a class is 3:2. If there are 30 students total, how many boys?',
    '18',
    '12',
    '15',
    '20',
    '3:2, сумма = 30',
    NULL, NULL, NULL,
    7, 'medium', 11, 2, 0,
    NOW(), NOW()
);
INSERT INTO problem_tags (problem_id, tag_name) VALUES ('prob-008', 'ratios'), ('prob-008', 'proportions');

-- Problem 9: Two-step equation
INSERT INTO math_problems VALUES (
    'prob-009',
    'Решите уравнение: 4x + 9 = 29',
    'Теңдеуді шешіңіз: 4x + 9 = 29',
    'Solve: 4x + 9 = 29',
    'x = 5',
    'x = 4',
    'x = 7',
    'x = 6',
    '4x + 9 = 29',
    NULL, NULL, NULL,
    7, 'medium', 11, 2, 0,
    NOW(), NOW()
);
INSERT INTO problem_tags (problem_id, tag_name) VALUES ('prob-009', 'algebra'), ('prob-009', 'linear_equations');

-- Problem 10: Decimal multiplication
INSERT INTO math_problems VALUES (
    'prob-010',
    'Вычислите: 3.5 × 4',
    'Есептеңіз: 3.5 × 4',
    'Calculate: 3.5 × 4',
    '14',
    '12',
    '15',
    '14.5',
    '3.5 × 4',
    NULL, NULL, NULL,
    7, 'easy', 11, 2, 0,
    NOW(), NOW()
);
INSERT INTO problem_tags (problem_id, tag_name) VALUES ('prob-010', 'decimals'), ('prob-010', 'arithmetic');

-- Problem 11: Angle in triangle
INSERT INTO math_problems VALUES (
    'prob-011',
    'В треугольнике два угла равны 45° и 65°. Найдите третий угол.',
    'Үшбұрыштың екі бұрышы 45° және 65°. Үшінші бұрышты табыңыз.',
    'In a triangle, two angles are 45° and 65°. Find the third angle.',
    '70°',
    '80°',
    '60°',
    '75°',
    '180° - 45° - 65°',
    NULL, NULL, NULL,
    7, 'medium', 11, 2, 0,
    NOW(), NOW()
);
INSERT INTO problem_tags (problem_id, tag_name) VALUES ('prob-011', 'geometry'), ('prob-011', 'angles');

-- Problem 12: Percentage increase
INSERT INTO math_problems VALUES (
    'prob-012',
    'Цена товара была 200 тенге, а стала 250 тенге. На сколько процентов увеличилась цена?',
    'Тауардың бағасы 200 теңге болды, ал 250 теңге болды. Баға неше пайызға өсті?',
    'Price was 200 tenge, became 250 tenge. By what percentage did it increase?',
    '25%',
    '50%',
    '20%',
    '30%',
    '(250-200)/200 × 100%',
    NULL, NULL, NULL,
    7, 'medium', 11, 2, 0,
    NOW(), NOW()
);
INSERT INTO problem_tags (problem_id, tag_name) VALUES ('prob-012', 'percentage'), ('prob-012', 'word_problems');

-- Problem 13: Fraction subtraction
INSERT INTO math_problems VALUES (
    'prob-013',
    'Вычислите: 7/8 - 3/8',
    'Есептеңіз: 7/8 - 3/8',
    'Calculate: 7/8 - 3/8',
    '4/8 = 1/2',
    '4/8',
    '10/8',
    '4/16',
    '7/8 - 3/8',
    NULL, NULL, NULL,
    7, 'easy', 11, 2, 0,
    NOW(), NOW()
);
INSERT INTO problem_tags (problem_id, tag_name) VALUES ('prob-013', 'fractions'), ('prob-013', 'arithmetic');

-- Problem 14: Order of operations
INSERT INTO math_problems VALUES (
    'prob-014',
    'Вычислите: 5 + 3 × 4',
    'Есептеңіз: 5 + 3 × 4',
    'Calculate: 5 + 3 × 4',
    '17',
    '32',
    '20',
    '29',
    '5 + 3 × 4',
    NULL, NULL, NULL,
    7, 'medium', 11, 2, 0,
    NOW(), NOW()
);
INSERT INTO problem_tags (problem_id, tag_name) VALUES ('prob-014', 'order_of_operations'), ('prob-014', 'arithmetic');

-- Problem 15: Area of triangle
INSERT INTO math_problems VALUES (
    'prob-015',
    'Площадь треугольника с основанием 10 см и высотой 6 см равна:',
    'Табаны 10 см, биіктігі 6 см үшбұрыштың ауданы:',
    'The area of a triangle with base 10 cm and height 6 cm is:',
    '30 см²',
    '60 см²',
    '16 см²',
    '20 см²',
    'S = (b × h)/2',
    NULL, NULL, NULL,
    7, 'medium', 11, 2, 0,
    NOW(), NOW()
);
INSERT INTO problem_tags (problem_id, tag_name) VALUES ('prob-015', 'geometry'), ('prob-015', 'area');

-- Problem 16: Simplifying expression
INSERT INTO math_problems VALUES (
    'prob-016',
    'Упростите: 5x + 3x',
    'Жеңілдетіңіз: 5x + 3x',
    'Simplify: 5x + 3x',
    '8x',
    '8x²',
    '15x',
    '2x',
    '5x + 3x',
    NULL, NULL, NULL,
    7, 'easy', 11, 2, 0,
    NOW(), NOW()
);
INSERT INTO problem_tags (problem_id, tag_name) VALUES ('prob-016', 'algebra'), ('prob-016', 'simplification');

-- Problem 17: Integer multiplication
INSERT INTO math_problems VALUES (
    'prob-017',
    'Вычислите: -6 × 4',
    'Есептеңіз: -6 × 4',
    'Calculate: -6 × 4',
    '-24',
    '24',
    '-10',
    '-2',
    '-6 × 4',
    NULL, NULL, NULL,
    7, 'easy', 11, 2, 0,
    NOW(), NOW()
);
INSERT INTO problem_tags (problem_id, tag_name) VALUES ('prob-017', 'integers'), ('prob-017', 'arithmetic');

-- Problem 18: Proportion
INSERT INTO math_problems VALUES (
    'prob-018',
    'Решите пропорцию: x/12 = 3/4',
    'Пропорцияны шешіңіз: x/12 = 3/4',
    'Solve the proportion: x/12 = 3/4',
    'x = 9',
    'x = 16',
    'x = 8',
    'x = 10',
    'x/12 = 3/4',
    NULL, NULL, NULL,
    7, 'medium', 11, 2, 0,
    NOW(), NOW()
);
INSERT INTO problem_tags (problem_id, tag_name) VALUES ('prob-018', 'proportions'), ('prob-018', 'algebra');

-- Problem 19: Circumference
INSERT INTO math_problems VALUES (
    'prob-019',
    'Найдите длину окружности с радиусом 7 см (π ≈ 3.14)',
    'Радиусы 7 см шеңбердің ұзындығын табыңыз (π ≈ 3.14)',
    'Find the circumference of a circle with radius 7 cm (π ≈ 3.14)',
    '43.96 см',
    '21.98 см',
    '153.86 см',
    '14 см',
    'C = 2πr',
    NULL, NULL, NULL,
    7, 'medium', 11, 2, 0,
    NOW(), NOW()
);
INSERT INTO problem_tags (problem_id, tag_name) VALUES ('prob-019', 'geometry'), ('prob-019', 'circles');

-- Problem 20: Mean average
INSERT INTO math_problems VALUES (
    'prob-020',
    'Найдите среднее арифметическое чисел: 8, 12, 15, 9',
    'Сандардың арифметикалық ортасын табыңыз: 8, 12, 15, 9',
    'Find the mean of: 8, 12, 15, 9',
    '11',
    '10',
    '12',
    '13',
    '(8+12+15+9)/4',
    NULL, NULL, NULL,
    7, 'easy', 11, 2, 0,
    NOW(), NOW()
);
INSERT INTO problem_tags (problem_id, tag_name) VALUES ('prob-020', 'statistics'), ('prob-020', 'mean');

-- Problem 21: Fraction multiplication
INSERT INTO math_problems VALUES (
    'prob-021',
    'Вычислите: 2/3 × 3/4',
    'Есептеңіз: 2/3 × 3/4',
    'Calculate: 2/3 × 3/4',
    '1/2',
    '2/3',
    '5/7',
    '6/12',
    '2/3 × 3/4',
    NULL, NULL, NULL,
    7, 'medium', 11, 2, 0,
    NOW(), NOW()
);
INSERT INTO problem_tags (problem_id, tag_name) VALUES ('prob-021', 'fractions'), ('prob-021', 'arithmetic');

-- Problem 22: Simple inequality
INSERT INTO math_problems VALUES (
    'prob-022',
    'Решите неравенство: x + 5 > 12',
    'Теңсіздікті шешіңіз: x + 5 > 12',
    'Solve the inequality: x + 5 > 12',
    'x > 7',
    'x > 17',
    'x < 7',
    'x > 5',
    'x + 5 > 12',
    NULL, NULL, NULL,
    7, 'medium', 11, 2, 0,
    NOW(), NOW()
);
INSERT INTO problem_tags (problem_id, tag_name) VALUES ('prob-022', 'inequalities'), ('prob-022', 'algebra');

-- Problem 23: Decimal division
INSERT INTO math_problems VALUES (
    'prob-023',
    'Вычислите: 8.4 ÷ 4',
    'Есептеңіз: 8.4 ÷ 4',
    'Calculate: 8.4 ÷ 4',
    '2.1',
    '2.4',
    '3.1',
    '1.9',
    '8.4 ÷ 4',
    NULL, NULL, NULL,
    7, 'easy', 11, 2, 0,
    NOW(), NOW()
);
INSERT INTO problem_tags (problem_id, tag_name) VALUES ('prob-023', 'decimals'), ('prob-023', 'arithmetic');

-- Problem 24: Volume of cube
INSERT INTO math_problems VALUES (
    'prob-024',
    'Найдите объем куба с ребром 5 см',
    'Қыры 5 см текшенің көлемін табыңыз',
    'Find the volume of a cube with edge 5 cm',
    '125 см³',
    '25 см³',
    '75 см³',
    '100 см³',
    'V = a³',
    NULL, NULL, NULL,
    7, 'medium', 11, 2, 0,
    NOW(), NOW()
);
INSERT INTO problem_tags (problem_id, tag_name) VALUES ('prob-024', 'geometry'), ('prob-024', 'volume');

-- Problem 25: Exponents
INSERT INTO math_problems VALUES (
    'prob-025',
    'Вычислите: 2⁴',
    'Есептеңіз: 2⁴',
    'Calculate: 2⁴',
    '16',
    '8',
    '32',
    '12',
    '2⁴',
    NULL, NULL, NULL,
    7, 'easy', 11, 2, 0,
    NOW(), NOW()
);
INSERT INTO problem_tags (problem_id, tag_name) VALUES ('prob-025', 'exponents'), ('prob-025', 'arithmetic');

-- Problem 26: Distributive property
INSERT INTO math_problems VALUES (
    'prob-026',
    'Упростите: 3(x + 4)',
    'Жеңілдетіңіз: 3(x + 4)',
    'Simplify: 3(x + 4)',
    '3x + 12',
    '3x + 4',
    'x + 12',
    '4x + 3',
    '3(x + 4)',
    NULL, NULL, NULL,
    7, 'medium', 11, 2, 0,
    NOW(), NOW()
);
INSERT INTO problem_tags (problem_id, tag_name) VALUES ('prob-026', 'algebra'), ('prob-026', 'distributive');

-- Problem 27: Complementary angles
INSERT INTO math_problems VALUES (
    'prob-027',
    'Два угла являются дополнительными. Если один угол равен 35°, чему равен другой?',
    'Екі бұрыш қосымша. Бір бұрыш 35° болса, екіншісі неше градус?',
    'Two angles are complementary. If one is 35°, what is the other?',
    '55°',
    '145°',
    '65°',
    '45°',
    '90° - 35°',
    NULL, NULL, NULL,
    7, 'easy', 11, 2, 0,
    NOW(), NOW()
);
INSERT INTO problem_tags (problem_id, tag_name) VALUES ('prob-027', 'geometry'), ('prob-027', 'angles');

-- Problem 28: Word problem - speed
INSERT INTO math_problems VALUES (
    'prob-028',
    'Машина проехала 180 км за 3 часа. Какова её средняя скорость?',
    'Көлік 3 сағатта 180 км жүрді. Оның орташа жылдамдығы қандай?',
    'A car traveled 180 km in 3 hours. What is its average speed?',
    '60 км/ч',
    '183 км/ч',
    '177 км/ч',
    '540 км/ч',
    'v = s/t',
    NULL, NULL, NULL,
    7, 'medium', 11, 2, 0,
    NOW(), NOW()
);
INSERT INTO problem_tags (problem_id, tag_name) VALUES ('prob-028', 'word_problems'), ('prob-028', 'speed');

-- Problem 29: Comparing fractions
INSERT INTO math_problems VALUES (
    'prob-029',
    'Какая дробь больше: 3/5 или 2/3?',
    'Қай бөлшек үлкен: 3/5 немесе 2/3?',
    'Which fraction is larger: 3/5 or 2/3?',
    '2/3',
    '3/5',
    'Они равны',
    'Нельзя сравнить',
    '3/5 = 0.6, 2/3 ≈ 0.67',
    NULL, NULL, NULL,
    7, 'medium', 11, 2, 0,
    NOW(), NOW()
);
INSERT INTO problem_tags (problem_id, tag_name) VALUES ('prob-029', 'fractions'), ('prob-029', 'comparison');

-- Problem 30: Absolute value
INSERT INTO math_problems VALUES (
    'prob-030',
    'Найдите: |-15|',
    'Табыңыз: |-15|',
    'Find: |-15|',
    '15',
    '-15',
    '0',
    '30',
    '|-15|',
    NULL, NULL, NULL,
    7, 'easy', 11, 2, 0,
    NOW(), NOW()
);
INSERT INTO problem_tags (problem_id, tag_name) VALUES ('prob-030', 'integers'), ('prob-030', 'absolute_value');

-- Problem 31: Equation with fractions
INSERT INTO math_problems VALUES (
    'prob-031',
    'Решите уравнение: x/3 = 5',
    'Теңдеуді шешіңіз: x/3 = 5',
    'Solve: x/3 = 5',
    'x = 15',
    'x = 5/3',
    'x = 8',
    'x = 2',
    'x/3 = 5',
    NULL, NULL, NULL,
    7, 'easy', 11, 2, 0,
    NOW(), NOW()
);
INSERT INTO problem_tags (problem_id, tag_name) VALUES ('prob-031', 'algebra'), ('prob-031', 'linear_equations');

-- Problem 32: Percentage of number
INSERT INTO math_problems VALUES (
    'prob-032',
    'Сколько процентов составляет 15 от 60?',
    '15 санының 60-қа қатынасы неше пайыз?',
    'What percentage is 15 of 60?',
    '25%',
    '15%',
    '4%',
    '20%',
    '(15/60) × 100%',
    NULL, NULL, NULL,
    7, 'medium', 11, 2, 0,
    NOW(), NOW()
);
INSERT INTO problem_tags (problem_id, tag_name) VALUES ('prob-032', 'percentage'), ('prob-032', 'arithmetic');

-- Problem 33: Parallel lines angles
INSERT INTO math_problems VALUES (
    'prob-033',
    'При пересечении двух параллельных прямых секущей соответственные углы равны. Если один угол 110°, чему равен соответственный угол?',
    'Екі параллель түзуді қиюшы қиғанда сәйкес бұрыштар тең. Бір бұрыш 110° болса, сәйкес бұрыш неше градус?',
    'When parallel lines are cut by a transversal, corresponding angles are equal. If one is 110°, what is the corresponding angle?',
    '110°',
    '70°',
    '180°',
    '90°',
    'Соответственные углы равны',
    NULL, NULL, NULL,
    7, 'hard', 11, 2, 0,
    NOW(), NOW()
);
INSERT INTO problem_tags (problem_id, tag_name) VALUES ('prob-033', 'geometry'), ('prob-033', 'parallel_lines');

-- Problem 34: Scientific notation
INSERT INTO math_problems VALUES (
    'prob-034',
    'Запишите число 5000 в научной нотации',
    '5000 санын ғылыми түрде жазыңыз',
    'Write 5000 in scientific notation',
    '5 × 10³',
    '5 × 10⁴',
    '50 × 10²',
    '0.5 × 10⁴',
    '5000 = 5 × 10³',
    NULL, NULL, NULL,
    7, 'hard', 11, 2, 0,
    NOW(), NOW()
);
INSERT INTO problem_tags (problem_id, tag_name) VALUES ('prob-034', 'scientific_notation'), ('prob-034', 'arithmetic');

-- Problem 35: Square root
INSERT INTO math_problems VALUES (
    'prob-035',
    'Найдите: √64',
    'Табыңыз: √64',
    'Find: √64',
    '8',
    '32',
    '4',
    '16',
    '√64',
    NULL, NULL, NULL,
    7, 'easy', 11, 2, 0,
    NOW(), NOW()
);
INSERT INTO problem_tags (problem_id, tag_name) VALUES ('prob-035', 'square_roots'), ('prob-035', 'arithmetic');

-- Problem 36: Combining like terms
INSERT INTO math_problems VALUES (
    'prob-036',
    'Упростите: 4x + 7 - 2x + 3',
    'Жеңілдетіңіз: 4x + 7 - 2x + 3',
    'Simplify: 4x + 7 - 2x + 3',
    '2x + 10',
    '6x + 10',
    '2x + 4',
    '4x + 10',
    '4x + 7 - 2x + 3',
    NULL, NULL, NULL,
    7, 'medium', 11, 2, 0,
    NOW(), NOW()
);
INSERT INTO problem_tags (problem_id, tag_name) VALUES ('prob-036', 'algebra'), ('prob-036', 'simplification');

-- Problem 37: Scale factor
INSERT INTO math_problems VALUES (
    'prob-037',
    'На карте 1 см соответствует 5 км. Если расстояние на карте 8 см, каково реальное расстояние?',
    'Картада 1 см 5 км-ге сәйкес келеді. Картадағы қашықтық 8 см болса, нақты қашықтық қандай?',
    'On a map, 1 cm represents 5 km. If the distance on the map is 8 cm, what is the actual distance?',
    '40 км',
    '13 км',
    '3 км',
    '8 км',
    '8 × 5',
    NULL, NULL, NULL,
    7, 'medium', 11, 2, 0,
    NOW(), NOW()
);
INSERT INTO problem_tags (problem_id, tag_name) VALUES ('prob-037', 'ratios'), ('prob-037', 'word_problems');

-- Problem 38: Median
INSERT INTO math_problems VALUES (
    'prob-038',
    'Найдите медиану набора чисел: 3, 7, 9, 15, 20',
    'Сандар жиынының медианасын табыңыз: 3, 7, 9, 15, 20',
    'Find the median of: 3, 7, 9, 15, 20',
    '9',
    '10.8',
    '7',
    '15',
    'Средний элемент',
    NULL, NULL, NULL,
    7, 'medium', 11, 2, 0,
    NOW(), NOW()
);
INSERT INTO problem_tags (problem_id, tag_name) VALUES ('prob-038', 'statistics'), ('prob-038', 'median');

-- Problem 39: Surface area
INSERT INTO math_problems VALUES (
    'prob-039',
    'Найдите площадь поверхности куба с ребром 4 см',
    'Қыры 4 см текшенің бетінің ауданын табыңыз',
    'Find the surface area of a cube with edge 4 cm',
    '96 см²',
    '64 см²',
    '16 см²',
    '24 см²',
    'SA = 6a²',
    NULL, NULL, NULL,
    7, 'hard', 11, 2, 0,
    NOW(), NOW()
);
INSERT INTO problem_tags (problem_id, tag_name) VALUES ('prob-039', 'geometry'), ('prob-039', 'surface_area');

-- Problem 40: Integer division
INSERT INTO math_problems VALUES (
    'prob-040',
    'Вычислите: -24 ÷ (-6)',
    'Есептеңіз: -24 ÷ (-6)',
    'Calculate: -24 ÷ (-6)',
    '4',
    '-4',
    '-30',
    '30',
    '-24 ÷ (-6)',
    NULL, NULL, NULL,
    7, 'easy', 11, 2, 0,
    NOW(), NOW()
);
INSERT INTO problem_tags (problem_id, tag_name) VALUES ('prob-040', 'integers'), ('prob-040', 'arithmetic');
