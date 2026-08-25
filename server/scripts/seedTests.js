import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, '../.env') });

import User from '../src/modules/user/user.model.js';
import ExamCategory from '../src/modules/exam-category/examCategory.model.js';
import Test from '../src/modules/test/test.model.js';
import TestAttempt from '../src/modules/test/testAttempt.model.js';

const slugify = (str) =>
  str
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '') +
  '-' +
  Date.now();

const testsData = [
  {
    title: 'JavaScript Fundamentals',
    description:
      'Test your core JavaScript knowledge covering variables, functions, closures, and ES6+ features.',
    duration: 30,
    difficulty: 'beginner',
    questions: [
      {
        question: 'Which keyword declares a block-scoped variable in ES6?',
        type: 'mcq',
        options: [
          { text: 'var', isCorrect: false },
          { text: 'let', isCorrect: true },
          { text: 'define', isCorrect: false },
          { text: 'scope', isCorrect: false },
        ],
        marks: 2,
        negativeMarks: 0.5,
        explanation:
          '`let` declares block-scoped variables introduced in ES6. `var` is function-scoped.',
      },
      {
        question: 'What does `typeof null` return in JavaScript?',
        type: 'mcq',
        options: [
          { text: '"null"', isCorrect: false },
          { text: '"undefined"', isCorrect: false },
          { text: '"object"', isCorrect: true },
          { text: '"boolean"', isCorrect: false },
        ],
        marks: 2,
        negativeMarks: 0.5,
        explanation:
          'A historic bug in JavaScript — `typeof null` returns "object" even though null is not an object.',
      },
      {
        question: 'Which method is used to add an element at the end of an array?',
        type: 'mcq',
        options: [
          { text: 'append()', isCorrect: false },
          { text: 'push()', isCorrect: true },
          { text: 'add()', isCorrect: false },
          { text: 'insert()', isCorrect: false },
        ],
        marks: 2,
        negativeMarks: 0.5,
        explanation:
          '`Array.push()` appends one or more elements to the end and returns the new length.',
      },
      {
        question: 'What is the output of `0 == false` in JavaScript?',
        type: 'mcq',
        options: [
          { text: 'false', isCorrect: false },
          { text: 'true', isCorrect: true },
          { text: 'TypeError', isCorrect: false },
          { text: 'undefined', isCorrect: false },
        ],
        marks: 2,
        negativeMarks: 0.5,
        explanation: 'With loose equality `==`, 0 is coerced to false, so the comparison is true.',
      },
      {
        question: 'Which of the following creates a Promise that resolves immediately?',
        type: 'mcq',
        options: [
          { text: 'Promise.reject(value)', isCorrect: false },
          { text: 'new Promise()', isCorrect: false },
          { text: 'Promise.resolve(value)', isCorrect: true },
          { text: 'Promise.all([])', isCorrect: false },
        ],
        marks: 2,
        negativeMarks: 0.5,
        explanation: '`Promise.resolve(value)` returns a Promise resolved with the given value.',
      },
      {
        question: 'What will `console.log(1 + "2")` print?',
        type: 'mcq',
        options: [
          { text: '3', isCorrect: false },
          { text: '"12"', isCorrect: true },
          { text: 'NaN', isCorrect: false },
          { text: 'TypeError', isCorrect: false },
        ],
        marks: 2,
        negativeMarks: 0.5,
        explanation:
          'When a number is added to a string, JavaScript coerces the number to a string and concatenates.',
      },
      {
        question: 'Which ES6 feature allows you to extract values from objects into variables?',
        type: 'mcq',
        options: [
          { text: 'Spread operator', isCorrect: false },
          { text: 'Destructuring', isCorrect: true },
          { text: 'Template literals', isCorrect: false },
          { text: 'Rest parameters', isCorrect: false },
        ],
        marks: 2,
        negativeMarks: 0.5,
        explanation:
          'Destructuring assignment lets you unpack values from arrays or properties from objects.',
      },
      {
        question: 'What does the `===` operator check?',
        type: 'mcq',
        options: [
          { text: 'Value only', isCorrect: false },
          { text: 'Type only', isCorrect: false },
          { text: 'Value and type (strict equality)', isCorrect: true },
          { text: 'Reference equality', isCorrect: false },
        ],
        marks: 2,
        negativeMarks: 0.5,
        explanation: '`===` is strict equality — it checks both value and type without coercion.',
      },
      {
        question: 'Which method converts a JSON string to a JavaScript object?',
        type: 'mcq',
        options: [
          { text: 'JSON.stringify()', isCorrect: false },
          { text: 'JSON.parse()', isCorrect: true },
          { text: 'JSON.convert()', isCorrect: false },
          { text: 'JSON.decode()', isCorrect: false },
        ],
        marks: 2,
        negativeMarks: 0.5,
        explanation:
          '`JSON.parse()` parses a JSON string and returns the corresponding JavaScript value.',
      },
      {
        question: 'What is a closure in JavaScript?',
        type: 'mcq',
        options: [
          { text: 'A function that closes the browser window', isCorrect: false },
          {
            text: 'A function with access to its outer scope even after the outer function returns',
            isCorrect: true,
          },
          { text: 'A method to close database connections', isCorrect: false },
          { text: 'An error handling block', isCorrect: false },
        ],
        marks: 2,
        negativeMarks: 0.5,
        explanation:
          'A closure is a function that retains access to its lexical scope even when called outside that scope.',
      },
    ],
  },
  {
    title: 'React.js Core Concepts',
    description:
      'Test your understanding of React — components, hooks, state management, and the virtual DOM.',
    duration: 25,
    difficulty: 'intermediate',
    questions: [
      {
        question: 'Which hook is used to manage state in a functional component?',
        type: 'mcq',
        options: [
          { text: 'useEffect', isCorrect: false },
          { text: 'useContext', isCorrect: false },
          { text: 'useState', isCorrect: true },
          { text: 'useRef', isCorrect: false },
        ],
        marks: 2,
        negativeMarks: 0.5,
        explanation: '`useState` returns a stateful value and a setter function to update it.',
      },
      {
        question: 'What is the purpose of the `key` prop in React lists?',
        type: 'mcq',
        options: [
          { text: 'To style list items', isCorrect: false },
          { text: 'To help React identify which items have changed', isCorrect: true },
          { text: 'To sort list items', isCorrect: false },
          { text: 'To encrypt list data', isCorrect: false },
        ],
        marks: 2,
        negativeMarks: 0.5,
        explanation:
          'Keys help React identify changed, added, or removed items for efficient DOM updates.',
      },
      {
        question: 'What does `useEffect` with an empty dependency array `[]` do?',
        type: 'mcq',
        options: [
          { text: 'Runs on every render', isCorrect: false },
          { text: 'Never runs', isCorrect: false },
          { text: 'Runs only once after the initial render', isCorrect: true },
          { text: 'Runs before the component unmounts', isCorrect: false },
        ],
        marks: 2,
        negativeMarks: 0.5,
        explanation:
          'An empty dependency array means the effect runs once after mount, similar to `componentDidMount`.',
      },
      {
        question: 'What is the Virtual DOM?',
        type: 'mcq',
        options: [
          { text: 'A direct copy of the browser DOM', isCorrect: false },
          { text: 'A lightweight in-memory representation of the real DOM', isCorrect: true },
          { text: 'A separate browser engine', isCorrect: false },
          { text: 'A CSS rendering layer', isCorrect: false },
        ],
        marks: 2,
        negativeMarks: 0.5,
        explanation:
          'React keeps a Virtual DOM, diffs it with the previous version, and only updates changed real DOM nodes.',
      },
      {
        question: 'Which of the following is NOT a React hook?',
        type: 'mcq',
        options: [
          { text: 'useCallback', isCorrect: false },
          { text: 'useMemo', isCorrect: false },
          { text: 'useHistory', isCorrect: false },
          { text: 'useService', isCorrect: true },
        ],
        marks: 2,
        negativeMarks: 0.5,
        explanation:
          '`useService` is not a React hook. `useHistory` is from React Router v5; the others are built-in React hooks.',
      },
      {
        question: 'How do you pass data from a parent to a child component in React?',
        type: 'mcq',
        options: [
          { text: 'Via state', isCorrect: false },
          { text: 'Via props', isCorrect: true },
          { text: 'Via context only', isCorrect: false },
          { text: 'Via refs', isCorrect: false },
        ],
        marks: 2,
        negativeMarks: 0.5,
        explanation:
          'Props (properties) are the standard mechanism for passing data from parent to child components.',
      },
      {
        question: 'What does React.memo do?',
        type: 'mcq',
        options: [
          { text: 'Memoizes async calls', isCorrect: false },
          {
            text: 'Prevents a component from re-rendering if its props have not changed',
            isCorrect: true,
          },
          { text: 'Stores data in localStorage', isCorrect: false },
          { text: 'Creates a memoized selector', isCorrect: false },
        ],
        marks: 2,
        negativeMarks: 0.5,
        explanation:
          'React.memo is a HOC that skips re-rendering when props are shallowly equal to the previous render.',
      },
      {
        question: 'What is JSX?',
        type: 'mcq',
        options: [
          {
            text: 'A JavaScript extension that allows HTML-like syntax in JS files',
            isCorrect: true,
          },
          { text: 'A CSS preprocessor', isCorrect: false },
          { text: 'A state management library', isCorrect: false },
          { text: 'A testing framework', isCorrect: false },
        ],
        marks: 2,
        negativeMarks: 0.5,
        explanation:
          'JSX is a syntax extension compiled by Babel to `React.createElement()` calls.',
      },
    ],
  },
  {
    title: 'Python Programming Basics',
    description:
      'Cover Python fundamentals — data types, control flow, functions, and OOP concepts.',
    duration: 20,
    difficulty: 'beginner',
    questions: [
      {
        question: 'Which data type is immutable in Python?',
        type: 'mcq',
        options: [
          { text: 'list', isCorrect: false },
          { text: 'dict', isCorrect: false },
          { text: 'tuple', isCorrect: true },
          { text: 'set', isCorrect: false },
        ],
        marks: 2,
        negativeMarks: 0.5,
        explanation:
          'Tuples are immutable sequences — their elements cannot be changed after creation.',
      },
      {
        question: 'What is the output of `len("Hello")` in Python?',
        type: 'mcq',
        options: [
          { text: '4', isCorrect: false },
          { text: '5', isCorrect: true },
          { text: '6', isCorrect: false },
          { text: 'TypeError', isCorrect: false },
        ],
        marks: 2,
        negativeMarks: 0.5,
        explanation: '"Hello" has 5 characters, so `len("Hello")` returns 5.',
      },
      {
        question: 'Which keyword is used to define a function in Python?',
        type: 'mcq',
        options: [
          { text: 'function', isCorrect: false },
          { text: 'fun', isCorrect: false },
          { text: 'def', isCorrect: true },
          { text: 'func', isCorrect: false },
        ],
        marks: 2,
        negativeMarks: 0.5,
        explanation: 'Python uses the `def` keyword to define functions.',
      },
      {
        question: 'How do you start a comment in Python?',
        type: 'mcq',
        options: [
          { text: '//', isCorrect: false },
          { text: '/* */', isCorrect: false },
          { text: '#', isCorrect: true },
          { text: '--', isCorrect: false },
        ],
        marks: 2,
        negativeMarks: 0.5,
        explanation: 'Python uses `#` for single-line comments.',
      },
      {
        question: 'What does the `range(5)` function produce?',
        type: 'mcq',
        options: [
          { text: '[1, 2, 3, 4, 5]', isCorrect: false },
          { text: '[0, 1, 2, 3, 4]', isCorrect: true },
          { text: '[0, 1, 2, 3, 4, 5]', isCorrect: false },
          { text: 'A string "01234"', isCorrect: false },
        ],
        marks: 2,
        negativeMarks: 0.5,
        explanation: '`range(5)` generates numbers from 0 up to (but not including) 5.',
      },
      {
        question: 'Which method removes and returns the last element of a list?',
        type: 'mcq',
        options: [
          { text: 'remove()', isCorrect: false },
          { text: 'delete()', isCorrect: false },
          { text: 'pop()', isCorrect: true },
          { text: 'discard()', isCorrect: false },
        ],
        marks: 2,
        negativeMarks: 0.5,
        explanation: '`list.pop()` without an argument removes and returns the last element.',
      },
    ],
  },
  {
    title: 'Data Structures & Algorithms',
    description:
      'Test your knowledge of arrays, linked lists, trees, sorting algorithms, and Big-O complexity.',
    duration: 45,
    difficulty: 'advanced',
    questions: [
      {
        question: 'What is the time complexity of binary search on a sorted array?',
        type: 'mcq',
        options: [
          { text: 'O(n)', isCorrect: false },
          { text: 'O(log n)', isCorrect: true },
          { text: 'O(n²)', isCorrect: false },
          { text: 'O(1)', isCorrect: false },
        ],
        marks: 3,
        negativeMarks: 1,
        explanation:
          'Binary search halves the search space each step, giving O(log n) time complexity.',
      },
      {
        question: 'Which data structure uses LIFO (Last In, First Out) order?',
        type: 'mcq',
        options: [
          { text: 'Queue', isCorrect: false },
          { text: 'Stack', isCorrect: true },
          { text: 'Heap', isCorrect: false },
          { text: 'Tree', isCorrect: false },
        ],
        marks: 3,
        negativeMarks: 1,
        explanation: 'A stack follows LIFO — the last element pushed is the first to be popped.',
      },
      {
        question: 'What is the worst-case time complexity of QuickSort?',
        type: 'mcq',
        options: [
          { text: 'O(n log n)', isCorrect: false },
          { text: 'O(n)', isCorrect: false },
          { text: 'O(n²)', isCorrect: true },
          { text: 'O(log n)', isCorrect: false },
        ],
        marks: 3,
        negativeMarks: 1,
        explanation:
          'QuickSort degrades to O(n²) when the pivot is always the smallest or largest element (e.g., sorted input with naive pivot).',
      },
      {
        question: 'Which traversal of a Binary Search Tree visits nodes in sorted order?',
        type: 'mcq',
        options: [
          { text: 'Pre-order', isCorrect: false },
          { text: 'Post-order', isCorrect: false },
          { text: 'In-order', isCorrect: true },
          { text: 'Level-order', isCorrect: false },
        ],
        marks: 3,
        negativeMarks: 1,
        explanation:
          'In-order traversal (left → root → right) of a BST visits nodes in ascending sorted order.',
      },
      {
        question: 'What is the space complexity of Merge Sort?',
        type: 'mcq',
        options: [
          { text: 'O(1)', isCorrect: false },
          { text: 'O(log n)', isCorrect: false },
          { text: 'O(n)', isCorrect: true },
          { text: 'O(n²)', isCorrect: false },
        ],
        marks: 3,
        negativeMarks: 1,
        explanation:
          'Merge Sort requires O(n) auxiliary space for the temporary arrays used during merging.',
      },
      {
        question: 'A hash table has average time complexity of ___ for search, insert, and delete.',
        type: 'mcq',
        options: [
          { text: 'O(n)', isCorrect: false },
          { text: 'O(log n)', isCorrect: false },
          { text: 'O(1)', isCorrect: true },
          { text: 'O(n log n)', isCorrect: false },
        ],
        marks: 3,
        negativeMarks: 1,
        explanation:
          'With a good hash function and low load factor, hash table operations are O(1) on average.',
      },
    ],
  },
  {
    title: 'Database SQL Fundamentals',
    description:
      'Test your SQL knowledge — queries, joins, aggregations, and database design concepts.',
    duration: 20,
    difficulty: 'intermediate',
    questions: [
      {
        question: 'Which SQL clause is used to filter records after grouping?',
        type: 'mcq',
        options: [
          { text: 'WHERE', isCorrect: false },
          { text: 'FILTER', isCorrect: false },
          { text: 'HAVING', isCorrect: true },
          { text: 'ORDER BY', isCorrect: false },
        ],
        marks: 2,
        negativeMarks: 0.5,
        explanation:
          '`HAVING` filters groups created by `GROUP BY`, while `WHERE` filters individual rows before grouping.',
      },
      {
        question:
          'What type of JOIN returns all rows from both tables, with NULLs for non-matching rows?',
        type: 'mcq',
        options: [
          { text: 'INNER JOIN', isCorrect: false },
          { text: 'LEFT JOIN', isCorrect: false },
          { text: 'RIGHT JOIN', isCorrect: false },
          { text: 'FULL OUTER JOIN', isCorrect: true },
        ],
        marks: 2,
        negativeMarks: 0.5,
        explanation:
          "FULL OUTER JOIN returns all rows from both tables; unmatched rows get NULL for the other table's columns.",
      },
      {
        question: 'Which constraint ensures a column has no duplicate values?',
        type: 'mcq',
        options: [
          { text: 'NOT NULL', isCorrect: false },
          { text: 'PRIMARY KEY', isCorrect: false },
          { text: 'UNIQUE', isCorrect: true },
          { text: 'CHECK', isCorrect: false },
        ],
        marks: 2,
        negativeMarks: 0.5,
        explanation:
          'The UNIQUE constraint ensures all values in a column are distinct. (PRIMARY KEY also implies UNIQUE but also NOT NULL.)',
      },
      {
        question: 'What does `SELECT COUNT(*) FROM users` return?',
        type: 'mcq',
        options: [
          { text: 'The sum of all values in the users table', isCorrect: false },
          { text: 'The total number of rows in the users table', isCorrect: true },
          { text: 'The number of columns in the users table', isCorrect: false },
          { text: 'The first row in the users table', isCorrect: false },
        ],
        marks: 2,
        negativeMarks: 0.5,
        explanation: '`COUNT(*)` counts all rows in the table, including rows with NULL values.',
      },
      {
        question: 'Which SQL statement is used to modify existing records in a table?',
        type: 'mcq',
        options: [
          { text: 'INSERT', isCorrect: false },
          { text: 'ALTER', isCorrect: false },
          { text: 'UPDATE', isCorrect: true },
          { text: 'MODIFY', isCorrect: false },
        ],
        marks: 2,
        negativeMarks: 0.5,
        explanation:
          '`UPDATE` modifies existing rows. `INSERT` adds new rows, `ALTER` changes table structure.',
      },
    ],
  },
];

const seedTests = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('📦 Connected to MongoDB');

    const teacher = await User.findOne({ role: 'teacher' });
    if (!teacher) {
      console.error('❌ No teacher found. Run the main seed script first: npm run seed');
      process.exit(1);
    }

    const categories = await ExamCategory.find({});
    if (!categories.length) {
      console.error('❌ No exam categories found. Run the main seed script first: npm run seed');
      process.exit(1);
    }

    const catMap = {};
    categories.forEach((c) => {
      catMap[c.slug] = c._id;
    });

    const categoryIds = categories.map((c) => c._id);

    await Test.deleteMany({});
    console.log('🗑️  Cleared existing tests');

    const categoryAssignment = [
      'programming-languages',
      'web-development',
      'programming-languages',
      'programming-languages',
      'database',
    ];

    const priceByDifficulty = { beginner: 199, intermediate: 299, advanced: 499 };

    for (let i = 0; i < testsData.length; i++) {
      const t = testsData[i];
      const categoryId = catMap[categoryAssignment[i]] || categoryIds[i % categoryIds.length];
      const totalMarks = t.questions.reduce((sum, q) => sum + q.marks, 0);
      const price = priceByDifficulty[t.difficulty] || 199;

      const test = new Test({
        title: t.title,
        slug: slugify(t.title),
        description: t.description,
        teacher: teacher._id,
        category: categoryId,
        questions: t.questions,
        duration: t.duration,
        difficulty: t.difficulty,
        totalMarks,
        passingMarks: Math.floor(totalMarks * 0.4),
        status: 'published',
        isPublished: true,
        isFree: false,
        price,
        publishedAt: new Date(),
      });

      await test.save();
      console.log(
        `✅ Created: "${t.title}" (${t.questions.length} questions, ${totalMarks} marks)`
      );
    }

    console.log('');
    console.log('🎉 Test data seeded successfully!');
    console.log(`📝 ${testsData.length} tests created and published.`);
    console.log('');
    console.log('Login as student to take tests:');
    console.log('   student@civicsedu.com / Student@123456');
    console.log('');

    process.exit(0);
  } catch (error) {
    console.error('❌ Seed error:', error.message);
    console.error(error);
    process.exit(1);
  }
};

seedTests();
