import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, '../.env') });

import User from '../src/modules/user/user.model.js';
import ExamCategory from '../src/modules/exam-category/examCategory.model.js';
import Course from '../src/modules/course/course.model.js';
import Quiz from '../src/modules/quiz/quiz.model.js';
import Discussion from '../src/modules/discussion/discussion.model.js';
import Note from '../src/modules/note/note.model.js';

const slugify = str =>
  str.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') + '-' + Date.now();

// ---------------------------------------------------------------------------
// COURSE DATA
// ---------------------------------------------------------------------------

const coursesData = [
  // ─── 1. Complete JavaScript Course ────────────────────────────────────────
  {
    title: 'Complete JavaScript Course 2024',
    description: 'Master JavaScript from the ground up. Learn variables, functions, closures, async/await, DOM manipulation, ES6+ features, and build real-world projects. Perfect for beginners and those looking to solidify their JS foundation.',
    shortDescription: 'Master modern JavaScript from zero to hero with hands-on projects.',
    level: 'beginner',
    categorySlug: 'web-development',
    tags: ['javascript', 'es6', 'web development', 'programming'],
    requirements: ['Basic HTML & CSS knowledge', 'A computer with internet access', 'No prior JavaScript experience needed'],
    whatYouLearn: [
      'Core JavaScript concepts — variables, types, functions, scope',
      'ES6+ features: arrow functions, destructuring, spread, modules',
      'Asynchronous JS: Promises, async/await, Fetch API',
      'DOM manipulation and event handling',
      'Object-Oriented Programming with classes',
      'Error handling and debugging techniques',
    ],
    thumbnail: { url: 'https://images.unsplash.com/photo-1627398242454-45a1465c2479?w=800', publicId: 'js-course' },
    sections: [
      {
        title: 'Getting Started with JavaScript',
        description: 'Install your environment and write your first JavaScript code.',
        lessons: [
          {
            title: 'Introduction & Course Overview',
            type: 'video',
            videoUrl: 'https://www.youtube.com/embed/W6NZfCO5SIk',
            duration: 780,
            isFree: true,
            content: 'Welcome to the Complete JavaScript Course! In this video, we cover what you will learn, how the course is structured, and how to get the most out of it.',
            resources: [
              { title: 'Course Slides - Introduction', url: 'https://example.com/js-intro-slides.pdf', type: 'pdf' },
              { title: 'JavaScript MDN Docs', url: 'https://developer.mozilla.org/en-US/docs/Web/JavaScript', type: 'link' },
            ],
          },
          {
            title: 'Setting Up Your Development Environment',
            type: 'video',
            videoUrl: 'https://www.youtube.com/embed/hdI2bqOjy3c',
            duration: 540,
            isFree: true,
            content: 'Install VS Code, Node.js, and configure useful extensions like Prettier and ESLint.',
            resources: [
              { title: 'VS Code Setup Guide', url: 'https://example.com/vscode-setup.pdf', type: 'pdf' },
              { title: 'Node.js Download', url: 'https://nodejs.org', type: 'link' },
            ],
          },
          {
            title: 'Variables, Data Types & Operators',
            type: 'video',
            videoUrl: 'https://www.youtube.com/embed/9emXNzqCKyg',
            duration: 1200,
            isFree: false,
            content: 'Deep dive into var, let, const — when to use each, primitive vs reference types, and all JS operators.',
            resources: [
              { title: 'Variables Cheat Sheet', url: 'https://example.com/js-variables.pdf', type: 'pdf' },
            ],
          },
          {
            title: 'Section 1 Notes & Summary',
            type: 'text',
            duration: 300,
            isFree: false,
            content: `## Section 1 Summary

### Key Concepts

**Variables**
- \`var\` — function-scoped, hoisted (avoid in modern JS)
- \`let\` — block-scoped, reassignable
- \`const\` — block-scoped, not reassignable (preferred by default)

**Primitive Types**
| Type | Example |
|------|---------|
| String | \`"hello"\` |
| Number | \`42\`, \`3.14\` |
| Boolean | \`true\`, \`false\` |
| null | \`null\` |
| undefined | \`undefined\` |
| Symbol | \`Symbol('id')\` |
| BigInt | \`9007199254740991n\` |

**Operators**
- Arithmetic: \`+ - * / % **\`
- Comparison: \`=== !== < > <= >=\`
- Logical: \`&& || !\`
- Nullish coalescing: \`??\`
- Optional chaining: \`?.\`

### Practice Exercise
Create variables for your name, age, and whether you are a student. Log them to the console.`,
            resources: [
              { title: 'Section 1 Practice Exercises', url: 'https://example.com/js-s1-exercises.pdf', type: 'pdf' },
            ],
          },
        ],
      },
      {
        title: 'Functions, Scope & Closures',
        description: 'Master the heart of JavaScript — functions in all their forms.',
        lessons: [
          {
            title: 'Function Declarations vs Expressions',
            type: 'video',
            videoUrl: 'https://www.youtube.com/embed/gigtS_5KOqo',
            duration: 900,
            isFree: false,
            content: 'Understand the difference between function declarations, expressions, and arrow functions. When to use each.',
            resources: [
              { title: 'Functions Reference Guide', url: 'https://example.com/js-functions.pdf', type: 'pdf' },
            ],
          },
          {
            title: 'Scope, Hoisting & the Temporal Dead Zone',
            type: 'video',
            videoUrl: 'https://www.youtube.com/embed/lW_erSjyMeM',
            duration: 1080,
            isFree: false,
            content: 'How JavaScript looks up variables — global scope, function scope, block scope, and the tricky temporal dead zone.',
            resources: [],
          },
          {
            title: 'Closures Explained',
            type: 'video',
            videoUrl: 'https://www.youtube.com/embed/vKJpN5FAeF4',
            duration: 960,
            isFree: false,
            content: 'Closures are one of JavaScript\'s most powerful features. See how inner functions remember their outer scope.',
            resources: [
              { title: 'Closure Patterns Cheat Sheet', url: 'https://example.com/closures.pdf', type: 'pdf' },
            ],
          },
          {
            title: 'Functions Deep Dive Notes',
            type: 'text',
            duration: 360,
            isFree: false,
            content: `## Functions, Scope & Closures

### Arrow Functions
\`\`\`js
// Regular function
function add(a, b) { return a + b; }

// Arrow function
const add = (a, b) => a + b;

// No parameters
const greet = () => 'Hello!';
\`\`\`

### Closure Example
\`\`\`js
function makeCounter() {
  let count = 0;
  return {
    increment: () => ++count,
    decrement: () => --count,
    value: () => count,
  };
}

const counter = makeCounter();
counter.increment(); // 1
counter.increment(); // 2
counter.value();     // 2
\`\`\`

### Common Closure Use Cases
1. **Data privacy** — encapsulate state
2. **Memoization** — cache expensive computations
3. **Partial application** — pre-fill function arguments`,
            resources: [
              { title: 'Scope & Closure Exercises', url: 'https://example.com/closure-exercises.pdf', type: 'pdf' },
            ],
          },
        ],
      },
      {
        title: 'Asynchronous JavaScript',
        description: 'Callbacks, Promises, and async/await — handle async operations the right way.',
        lessons: [
          {
            title: 'The Event Loop Explained',
            type: 'video',
            videoUrl: 'https://www.youtube.com/embed/8aGhZQkoFbQ',
            duration: 1620,
            isFree: false,
            content: 'Philip Roberts\' famous talk — understand exactly how the JavaScript event loop works under the hood.',
            resources: [
              { title: 'Event Loop Diagram', url: 'https://example.com/event-loop.pdf', type: 'pdf' },
            ],
          },
          {
            title: 'Promises & Async/Await',
            type: 'video',
            videoUrl: 'https://www.youtube.com/embed/DHvZLI7Db8E',
            duration: 1440,
            isFree: false,
            content: 'Move from callback hell to clean async code with Promises and the async/await syntax.',
            resources: [
              { title: 'Async Patterns Cheat Sheet', url: 'https://example.com/async-patterns.pdf', type: 'pdf' },
              { title: 'Promise MDN Reference', url: 'https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise', type: 'link' },
            ],
          },
          {
            title: 'Fetch API & Working with REST APIs',
            type: 'video',
            videoUrl: 'https://www.youtube.com/embed/cuEtnrL9-H0',
            duration: 1080,
            isFree: false,
            content: 'Use the Fetch API to make HTTP requests, handle responses, and deal with errors properly.',
            resources: [
              { title: 'REST API Project Starter', url: 'https://example.com/fetch-project.zip', type: 'doc' },
            ],
          },
          {
            title: 'Async JS Quiz',
            type: 'quiz',
            duration: 600,
            isFree: false,
            content: 'Test your understanding of async JavaScript concepts.',
            resources: [],
          },
        ],
      },
    ],
  },

  // ─── 2. React.js Masterclass ────────────────────────────────────────────────
  {
    title: 'React.js Masterclass — Build Modern UIs',
    description: 'Learn React from scratch and build production-ready applications. Covers hooks, state management with Redux Toolkit, React Router, performance optimization, and testing. Includes 3 full project builds.',
    shortDescription: 'Build professional React apps with hooks, Redux, and React Router.',
    level: 'intermediate',
    categorySlug: 'web-development',
    tags: ['react', 'redux', 'hooks', 'javascript', 'frontend'],
    requirements: ['Solid JavaScript knowledge (ES6+)', 'Basic HTML & CSS', 'Node.js installed'],
    whatYouLearn: [
      'React fundamentals: JSX, components, props, state',
      'All essential hooks: useState, useEffect, useCallback, useMemo, useRef',
      'State management with Redux Toolkit',
      'Client-side routing with React Router v6',
      'Performance optimization techniques',
      'Build 3 complete projects from scratch',
    ],
    thumbnail: { url: 'https://images.unsplash.com/photo-1633356122544-f134324a6cee?w=800', publicId: 'react-course' },
    sections: [
      {
        title: 'React Fundamentals',
        description: 'Core building blocks of every React application.',
        lessons: [
          {
            title: 'What is React & Why Use It?',
            type: 'video',
            videoUrl: 'https://www.youtube.com/embed/Tn6-PIqc4UM',
            duration: 660,
            isFree: true,
            content: 'Understand the virtual DOM, component model, and why React has become the dominant UI library.',
            resources: [
              { title: 'React Official Docs', url: 'https://react.dev', type: 'link' },
              { title: 'React Cheat Sheet', url: 'https://example.com/react-cheatsheet.pdf', type: 'pdf' },
            ],
          },
          {
            title: 'JSX Deep Dive',
            type: 'video',
            videoUrl: 'https://www.youtube.com/embed/7fPXI_MnBOY',
            duration: 840,
            isFree: true,
            content: 'How JSX compiles to React.createElement calls, rules of JSX, and common pitfalls.',
            resources: [],
          },
          {
            title: 'Components, Props & State',
            type: 'video',
            videoUrl: 'https://www.youtube.com/embed/35lXWvCuM8o',
            duration: 1320,
            isFree: false,
            content: 'Build functional components, pass data via props, and manage local state with useState.',
            resources: [
              { title: 'Components Exercise Files', url: 'https://example.com/react-components.zip', type: 'doc' },
            ],
          },
          {
            title: 'React Fundamentals — Study Notes',
            type: 'text',
            duration: 420,
            isFree: false,
            content: `## React Fundamentals Reference

### Component Anatomy
\`\`\`jsx
// Functional Component (modern React)
function Greeting({ name, age }) {
  return (
    <div className="card">
      <h1>Hello, {name}!</h1>
      <p>You are {age} years old.</p>
    </div>
  );
}

export default Greeting;
\`\`\`

### useState Hook
\`\`\`jsx
const [count, setCount] = useState(0);

// Update based on previous state (safe!)
setCount(prev => prev + 1);
\`\`\`

### Props Rules
- Props flow **down** (parent → child)
- Props are **read-only** in the child
- Use **destructuring** for cleaner code
- Default props: \`function Btn({ label = 'Click me' })\`

### Key JSX Rules
1. Must return a single root element (or \`<></>\` fragment)
2. Use \`className\` instead of \`class\`
3. All tags must be self-closing or have a closing tag
4. JavaScript expressions go inside \`{}\``,
            resources: [
              { title: 'React Fundamentals PDF', url: 'https://example.com/react-fundamentals.pdf', type: 'pdf' },
            ],
          },
        ],
      },
      {
        title: 'Hooks In Depth',
        description: 'Master all the essential React hooks.',
        lessons: [
          {
            title: 'useEffect — Side Effects in React',
            type: 'video',
            videoUrl: 'https://www.youtube.com/embed/0ZJgIjIuY7U',
            duration: 1500,
            isFree: false,
            content: 'Data fetching, subscriptions, timers — useEffect handles all side effects. Learn the dependency array, cleanup functions, and common mistakes.',
            resources: [
              { title: 'useEffect Patterns Guide', url: 'https://example.com/useeffect.pdf', type: 'pdf' },
            ],
          },
          {
            title: 'useCallback & useMemo — Performance Hooks',
            type: 'video',
            videoUrl: 'https://www.youtube.com/embed/_AyFbAt6Xn0',
            duration: 1140,
            isFree: false,
            content: 'Prevent unnecessary re-renders by memoizing functions and computed values.',
            resources: [],
          },
          {
            title: 'useRef & Custom Hooks',
            type: 'video',
            videoUrl: 'https://www.youtube.com/embed/t2ypzz6gJm0',
            duration: 1260,
            isFree: false,
            content: 'Access DOM elements with useRef, persist values without re-renders, and extract reusable logic into custom hooks.',
            resources: [
              { title: 'Custom Hooks Collection', url: 'https://example.com/custom-hooks.pdf', type: 'pdf' },
              { title: 'usehooks.com', url: 'https://usehooks.com', type: 'link' },
            ],
          },
          {
            title: 'Hooks Quiz',
            type: 'quiz',
            duration: 600,
            isFree: false,
            content: 'Test your knowledge of React hooks.',
            resources: [],
          },
        ],
      },
      {
        title: 'State Management with Redux Toolkit',
        description: 'Scale your app state with Redux Toolkit and RTK Query.',
        lessons: [
          {
            title: 'Why Redux? When to Use It',
            type: 'video',
            videoUrl: 'https://www.youtube.com/embed/CVpUuw9XSjY',
            duration: 720,
            isFree: false,
            content: 'Understand the problems Redux solves, when it\'s overkill, and why Redux Toolkit makes it ergonomic.',
            resources: [
              { title: 'Redux Toolkit Docs', url: 'https://redux-toolkit.js.org', type: 'link' },
            ],
          },
          {
            title: 'createSlice, useSelector & useDispatch',
            type: 'video',
            videoUrl: 'https://www.youtube.com/embed/9zySeP5vH9c',
            duration: 1680,
            isFree: false,
            content: 'Build a complete cart feature using createSlice, access state with useSelector, and dispatch actions with useDispatch.',
            resources: [
              { title: 'Redux Project Starter', url: 'https://example.com/redux-starter.zip', type: 'doc' },
              { title: 'Redux Toolkit Cheat Sheet', url: 'https://example.com/redux-cheatsheet.pdf', type: 'pdf' },
            ],
          },
          {
            title: 'Async Thunks & API Integration',
            type: 'video',
            videoUrl: 'https://www.youtube.com/embed/93CR_yURoII',
            duration: 1440,
            isFree: false,
            content: 'Fetch data from APIs with createAsyncThunk and handle loading/error/success states cleanly.',
            resources: [
              { title: 'Async Thunk Patterns', url: 'https://example.com/async-thunk.pdf', type: 'pdf' },
            ],
          },
        ],
      },
    ],
  },

  // ─── 3. Python for Data Science ─────────────────────────────────────────────
  {
    title: 'Python for Data Science & Machine Learning',
    description: 'Go from Python basics to building ML models. Learn NumPy, Pandas, Matplotlib, Scikit-learn, and build 5 end-to-end data science projects including a house price predictor and image classifier.',
    shortDescription: 'From Python basics to real ML projects with NumPy, Pandas & Scikit-learn.',
    level: 'intermediate',
    categorySlug: 'data-science',
    tags: ['python', 'data science', 'machine learning', 'pandas', 'numpy'],
    requirements: ['Basic programming knowledge in any language', 'Python installed (3.8+)', 'No ML experience required'],
    whatYouLearn: [
      'Python for data manipulation and analysis',
      'NumPy arrays and vectorized operations',
      'Pandas DataFrames for data cleaning and EDA',
      'Data visualization with Matplotlib & Seaborn',
      'Machine learning with Scikit-learn',
      'Build and deploy 5 ML projects',
    ],
    thumbnail: { url: 'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?w=800', publicId: 'python-ds-course' },
    sections: [
      {
        title: 'Python Foundations for Data Science',
        description: 'The Python you need to know before touching data.',
        lessons: [
          {
            title: 'Python Crash Course for DS',
            type: 'video',
            videoUrl: 'https://www.youtube.com/embed/_uQrJ0TkZlc',
            duration: 14400,
            isFree: true,
            content: 'A rapid but thorough introduction to Python — variables, data structures, functions, and file I/O specifically for data science use.',
            resources: [
              { title: 'Python DS Cheat Sheet', url: 'https://example.com/python-ds-cheatsheet.pdf', type: 'pdf' },
              { title: 'Python.org Official Docs', url: 'https://docs.python.org/3/', type: 'link' },
            ],
          },
          {
            title: 'Jupyter Notebooks & Google Colab',
            type: 'video',
            videoUrl: 'https://www.youtube.com/embed/inN8seMm7UI',
            duration: 840,
            isFree: true,
            content: 'Set up your data science workspace — Jupyter locally and Google Colab for cloud notebooks (free GPU!).',
            resources: [
              { title: 'Jupyter Shortcuts Guide', url: 'https://example.com/jupyter-shortcuts.pdf', type: 'pdf' },
              { title: 'Google Colab', url: 'https://colab.research.google.com', type: 'link' },
            ],
          },
          {
            title: 'NumPy — The Foundation of DS in Python',
            type: 'video',
            videoUrl: 'https://www.youtube.com/embed/GB9ByFAIAH4',
            duration: 3600,
            isFree: false,
            content: 'Create and manipulate n-dimensional arrays, perform vectorized math, and understand broadcasting rules.',
            resources: [
              { title: 'NumPy Exercises Notebook', url: 'https://example.com/numpy-exercises.ipynb', type: 'doc' },
              { title: 'NumPy Cheat Sheet', url: 'https://example.com/numpy-cheatsheet.pdf', type: 'pdf' },
            ],
          },
          {
            title: 'Python DS Foundations — Notes',
            type: 'text',
            duration: 480,
            isFree: false,
            content: `## Python for Data Science — Foundation Notes

### Essential Data Structures
\`\`\`python
# Lists
data = [1, 2, 3, 4, 5]
data.append(6)
squares = [x**2 for x in data]  # list comprehension

# Dictionaries
student = {'name': 'Alice', 'grade': 92}
student['subject'] = 'Math'

# Tuples (immutable)
coordinates = (40.7128, -74.0060)
lat, lon = coordinates  # unpacking
\`\`\`

### NumPy Essentials
\`\`\`python
import numpy as np

arr = np.array([1, 2, 3, 4, 5])
matrix = np.zeros((3, 3))
rand = np.random.randn(100)

# Vectorized operations (no loops needed!)
arr * 2          # [2, 4, 6, 8, 10]
arr[arr > 3]     # [4, 5]  — boolean indexing
np.mean(arr)     # 3.0
np.std(arr)      # 1.41
\`\`\`

### Key NumPy Functions
| Function | Purpose |
|----------|---------|
| \`np.zeros()\` | Array of zeros |
| \`np.ones()\` | Array of ones |
| \`np.arange()\` | Range as array |
| \`np.linspace()\` | Evenly spaced values |
| \`np.reshape()\` | Change array shape |
| \`np.dot()\` | Matrix multiplication |`,
            resources: [
              { title: 'Full NumPy Reference PDF', url: 'https://example.com/numpy-reference.pdf', type: 'pdf' },
            ],
          },
        ],
      },
      {
        title: 'Pandas & Data Analysis',
        description: 'Clean, explore, and transform real-world datasets with Pandas.',
        lessons: [
          {
            title: 'Pandas DataFrames — Complete Guide',
            type: 'video',
            videoUrl: 'https://www.youtube.com/embed/vmEHCJofslg',
            duration: 3900,
            isFree: false,
            content: 'Load CSVs, inspect DataFrames, select & filter data, handle missing values, and aggregate with groupby.',
            resources: [
              { title: 'Pandas Cheat Sheet', url: 'https://example.com/pandas-cheatsheet.pdf', type: 'pdf' },
              { title: 'Sample Datasets', url: 'https://example.com/sample-datasets.zip', type: 'doc' },
            ],
          },
          {
            title: 'Data Cleaning & Feature Engineering',
            type: 'video',
            videoUrl: 'https://www.youtube.com/embed/bDhvCp3_lYw',
            duration: 2700,
            isFree: false,
            content: 'Handle nulls, duplicates, outliers, encode categoricals, and engineer new features from raw data.',
            resources: [
              { title: 'Data Cleaning Checklist', url: 'https://example.com/data-cleaning.pdf', type: 'pdf' },
            ],
          },
          {
            title: 'Exploratory Data Analysis (EDA)',
            type: 'video',
            videoUrl: 'https://www.youtube.com/embed/xi0vhXFPegw',
            duration: 2400,
            isFree: false,
            content: 'Systematic EDA workflow: distributions, correlations, and visualizations with Matplotlib and Seaborn.',
            resources: [
              { title: 'EDA Project Notebook', url: 'https://example.com/eda-project.ipynb', type: 'doc' },
            ],
          },
          {
            title: 'Pandas & EDA Quiz',
            type: 'quiz',
            duration: 600,
            isFree: false,
            content: 'Test your Pandas and data analysis skills.',
            resources: [],
          },
        ],
      },
      {
        title: 'Machine Learning with Scikit-learn',
        description: 'Build, train, and evaluate ML models from regression to classification.',
        lessons: [
          {
            title: 'ML Fundamentals — Supervised vs Unsupervised',
            type: 'video',
            videoUrl: 'https://www.youtube.com/embed/ukzFI9rgwfU',
            duration: 1200,
            isFree: false,
            content: 'Understand train/test splits, overfitting, bias-variance tradeoff, and the Scikit-learn API.',
            resources: [
              { title: 'ML Concepts Slides', url: 'https://example.com/ml-concepts.pdf', type: 'pdf' },
            ],
          },
          {
            title: 'Linear & Logistic Regression',
            type: 'video',
            videoUrl: 'https://www.youtube.com/embed/VmbA0pi2cRQ',
            duration: 2100,
            isFree: false,
            content: 'Fit linear models for regression, logistic regression for binary classification, evaluate with metrics.',
            resources: [
              { title: 'Regression Project Files', url: 'https://example.com/regression-project.zip', type: 'doc' },
            ],
          },
          {
            title: 'Decision Trees & Random Forests',
            type: 'video',
            videoUrl: 'https://www.youtube.com/embed/v6VJ2RO66Ag',
            duration: 1800,
            isFree: false,
            content: 'Ensemble methods — how random forests improve on decision trees through bagging and feature randomness.',
            resources: [
              { title: 'Random Forest Cheat Sheet', url: 'https://example.com/random-forest.pdf', type: 'pdf' },
            ],
          },
        ],
      },
    ],
  },
];

// ---------------------------------------------------------------------------
// QUIZ DATA (linked to courses after creation)
// ---------------------------------------------------------------------------

const quizzesByCourse = {
  'Complete JavaScript Course 2024': [
    {
      title: 'JavaScript Variables & Types Quiz',
      passingScore: 60,
      questions: [
        {
          question: 'What is the difference between let and var?',
          options: [
            { text: 'let is function-scoped, var is block-scoped', isCorrect: false },
            { text: 'let is block-scoped, var is function-scoped', isCorrect: true },
            { text: 'They are identical in modern JavaScript', isCorrect: false },
            { text: 'var does not exist in ES6', isCorrect: false },
          ],
          explanation: 'let is block-scoped (limited to the nearest {}), while var is function-scoped.',
        },
        {
          question: 'What does typeof [] return?',
          options: [
            { text: '"array"', isCorrect: false },
            { text: '"object"', isCorrect: true },
            { text: '"list"', isCorrect: false },
            { text: '"undefined"', isCorrect: false },
          ],
          explanation: 'Arrays in JavaScript are objects, so typeof [] returns "object". Use Array.isArray() to check for arrays.',
        },
        {
          question: 'Which of these creates a constant that cannot be reassigned?',
          options: [
            { text: 'let x = 5', isCorrect: false },
            { text: 'var x = 5', isCorrect: false },
            { text: 'const x = 5', isCorrect: true },
            { text: 'final x = 5', isCorrect: false },
          ],
          explanation: 'const prevents reassignment. Note: const objects/arrays can still be mutated.',
        },
        {
          question: 'What is the output of 2 + "3"?',
          options: [
            { text: '5', isCorrect: false },
            { text: '"23"', isCorrect: true },
            { text: 'NaN', isCorrect: false },
            { text: 'TypeError', isCorrect: false },
          ],
          explanation: 'When a number and string are added, JS coerces the number to a string and concatenates.',
        },
      ],
    },
    {
      title: 'Closures & Scope Quiz',
      passingScore: 60,
      questions: [
        {
          question: 'What is a closure?',
          options: [
            { text: 'A function that closes the browser window', isCorrect: false },
            { text: 'A function bundled with its lexical environment', isCorrect: true },
            { text: 'A way to end a loop early', isCorrect: false },
            { text: 'A method to import modules', isCorrect: false },
          ],
          explanation: 'A closure is a function that retains access to its outer scope even after the outer function has returned.',
        },
        {
          question: 'What will the following output? const fn = () => { let x = 10; return () => x; }; console.log(fn()());',
          options: [
            { text: 'undefined', isCorrect: false },
            { text: 'ReferenceError', isCorrect: false },
            { text: '10', isCorrect: true },
            { text: 'null', isCorrect: false },
          ],
          explanation: 'The inner arrow function closes over x from the outer function, returning 10.',
        },
        {
          question: 'Which scope is created by a pair of {} inside an if statement (with let)?',
          options: [
            { text: 'Function scope', isCorrect: false },
            { text: 'Global scope', isCorrect: false },
            { text: 'Block scope', isCorrect: true },
            { text: 'Module scope', isCorrect: false },
          ],
          explanation: 'let and const respect block scope — variables declared inside {} are not accessible outside.',
        },
      ],
    },
  ],
  'React.js Masterclass — Build Modern UIs': [
    {
      title: 'React Hooks Knowledge Check',
      passingScore: 70,
      questions: [
        {
          question: 'When does useEffect run with an empty dependency array []?',
          options: [
            { text: 'On every render', isCorrect: false },
            { text: 'Never', isCorrect: false },
            { text: 'Once after the initial mount', isCorrect: true },
            { text: 'Once before the component mounts', isCorrect: false },
          ],
          explanation: 'An empty array means the effect has no dependencies, so it only runs once after the initial render.',
        },
        {
          question: 'What does useCallback memoize?',
          options: [
            { text: 'A computed value', isCorrect: false },
            { text: 'A function reference', isCorrect: true },
            { text: 'A component render', isCorrect: false },
            { text: 'An API response', isCorrect: false },
          ],
          explanation: 'useCallback returns a memoized function that only changes if one of its dependencies changes.',
        },
        {
          question: 'How do you persist a value between renders WITHOUT causing a re-render?',
          options: [
            { text: 'useState', isCorrect: false },
            { text: 'useContext', isCorrect: false },
            { text: 'useRef', isCorrect: true },
            { text: 'useMemo', isCorrect: false },
          ],
          explanation: 'useRef returns a mutable ref object whose .current property does not trigger re-renders when changed.',
        },
      ],
    },
  ],
  'Python for Data Science & Machine Learning': [
    {
      title: 'NumPy & Pandas Fundamentals Quiz',
      passingScore: 65,
      questions: [
        {
          question: 'Which NumPy function creates an array of evenly spaced values?',
          options: [
            { text: 'np.zeros()', isCorrect: false },
            { text: 'np.range()', isCorrect: false },
            { text: 'np.linspace()', isCorrect: true },
            { text: 'np.even()', isCorrect: false },
          ],
          explanation: 'np.linspace(start, stop, num) creates num evenly spaced values between start and stop.',
        },
        {
          question: 'What does df.dropna() do in Pandas?',
          options: [
            { text: 'Drops all columns', isCorrect: false },
            { text: 'Removes rows with missing values', isCorrect: true },
            { text: 'Fills missing values with zero', isCorrect: false },
            { text: 'Counts missing values', isCorrect: false },
          ],
          explanation: 'dropna() removes rows (or columns) that contain at least one NaN/null value.',
        },
        {
          question: 'Which Pandas method gives you descriptive statistics?',
          options: [
            { text: 'df.info()', isCorrect: false },
            { text: 'df.stats()', isCorrect: false },
            { text: 'df.describe()', isCorrect: true },
            { text: 'df.summary()', isCorrect: false },
          ],
          explanation: 'df.describe() returns count, mean, std, min, quartiles, and max for all numeric columns.',
        },
        {
          question: 'What is overfitting in ML?',
          options: [
            { text: 'Model performs poorly on both training and test data', isCorrect: false },
            { text: 'Model performs well on training data but poorly on unseen data', isCorrect: true },
            { text: 'Model is too simple to learn patterns', isCorrect: false },
            { text: 'Model training takes too long', isCorrect: false },
          ],
          explanation: 'Overfitting means the model memorizes training data instead of learning general patterns.',
        },
      ],
    },
  ],
};

// ---------------------------------------------------------------------------
// DISCUSSION DATA
// ---------------------------------------------------------------------------

const discussionsByCourse = {
  'Complete JavaScript Course 2024': [
    {
      title: 'Why does typeof null return "object"?',
      content: 'I\'m confused about this behavior. In the lecture it was mentioned that null is a primitive, but typeof null returns "object". Is this a bug in JavaScript? Will it ever be fixed?',
      tags: ['typeof', 'null', 'primitives'],
      isPinned: false,
      replies: [
        { content: 'Great question! This is actually a historical bug from the very first version of JavaScript. The typeof operator checks a type tag stored in the value\'s binary representation. null was given the tag 0000, which is the same as objects. Since fixing it would break existing code, it has never been corrected — a famous example of backwards compatibility preventing fixes.' },
        { content: 'To safely check for null, always use === null: \n\nif (value === null) { ... }\n\nOr to check for both null and undefined: if (value == null) { ... }' },
      ],
    },
    {
      title: 'Best way to handle async errors in production?',
      content: 'I\'ve been using try/catch with async/await, but I\'ve seen people use .catch() on Promises. What\'s the recommended pattern for production apps?',
      tags: ['async', 'error handling', 'promises'],
      isPinned: true,
      replies: [
        { content: 'Both are valid! The key is consistency. For async/await, wrapping every await in try/catch gets verbose. A common pattern is a helper: const safeAsync = async (fn) => { try { return [await fn(), null]; } catch (e) { return [null, e]; } }. Then: const [data, err] = await safeAsync(() => fetchUser(id));' },
        { content: 'Another popular approach is to use a global error boundary at the top level and let errors propagate up. In Node.js, always listen for process.on("unhandledRejection") to catch any missed promise rejections.' },
      ],
    },
  ],
  'React.js Masterclass — Build Modern UIs': [
    {
      title: 'useEffect vs useLayoutEffect — when to use which?',
      content: 'I understand that useEffect runs after the paint and useLayoutEffect runs before. But when exactly should I reach for useLayoutEffect? Are there performance implications?',
      tags: ['useEffect', 'useLayoutEffect', 'hooks', 'performance'],
      isPinned: false,
      replies: [
        { content: 'Use useLayoutEffect only when you need to read or mutate the DOM synchronously before the browser paints — for example, measuring an element\'s size or position to avoid a flash. For everything else (data fetching, subscriptions, logging), stick with useEffect. useLayoutEffect blocks painting, so overusing it hurts perceived performance.' },
      ],
    },
    {
      title: 'Should I use Redux or React Context for global state?',
      content: 'My app has user authentication and a shopping cart. Is this a good use case for Redux? Or is React Context enough?',
      tags: ['redux', 'context', 'state management'],
      isPinned: true,
      replies: [
        { content: 'Great question! For auth state (user object, token), Context is often enough since it doesn\'t update frequently. For a shopping cart that updates often (add/remove items, quantity changes), Redux Toolkit is better because it avoids the re-render performance issues that Context has with high-frequency updates.' },
        { content: 'My rule of thumb: Context for low-frequency global state (theme, locale, auth). Redux for frequently updated state, complex state logic, or when you need time-travel debugging.' },
      ],
    },
  ],
  'Python for Data Science & Machine Learning': [
    {
      title: 'When to use Pandas vs NumPy?',
      content: 'I\'m confused about when I should use a NumPy array vs a Pandas DataFrame. They seem to overlap a lot. Can someone explain the distinction?',
      tags: ['pandas', 'numpy', 'data structures'],
      isPinned: false,
      replies: [
        { content: 'Think of it this way: NumPy is optimized for **homogeneous numerical computation** — matrices, linear algebra, vectorized math. Pandas is built ON TOP of NumPy and adds labeled axes, mixed data types, SQL-like operations (groupby, merge, pivot), and time series handling. For raw matrix math, use NumPy. For tabular data with column names, use Pandas.' },
        { content: 'Practical guide: If your data is a CSV with column headers, use Pandas. If you\'re doing matrix multiplication for a neural network, use NumPy (or PyTorch/TensorFlow tensors). You\'ll often convert between them with df.values or np.array(df).' },
      ],
    },
  ],
};

// ---------------------------------------------------------------------------
// NOTE DATA (seeded as student notes)
// ---------------------------------------------------------------------------

const notesByCourse = {
  'Complete JavaScript Course 2024': [
    { content: 'Remember: const does not make objects immutable! You can still add/change properties. Use Object.freeze() for true immutability.', timestamp: 342 },
    { content: 'Closure tip: every time a function is called, a new closure scope is created. This is why factory functions work!', timestamp: 1205 },
    { content: 'The event loop: Call Stack → Web APIs → Callback Queue → Call Stack. Microtasks (Promises) always run before macrotasks (setTimeout).', timestamp: 890 },
  ],
  'React.js Masterclass — Build Modern UIs': [
    { content: 'Key insight: React re-renders a component when its STATE or PROPS change. Avoid putting everything in state — derived values should just be variables.', timestamp: 420 },
    { content: 'useEffect cleanup function runs BEFORE the next effect runs AND when the component unmounts. Always clean up subscriptions and timers!', timestamp: 1100 },
  ],
  'Python for Data Science & Machine Learning': [
    { content: 'df.info() shows data types and non-null counts. Always run this first on a new dataset to understand what you\'re working with.', timestamp: 660 },
    { content: 'Remember: iloc uses integer positions, loc uses labels. Easy to confuse — iloc is like indexing a Python list.', timestamp: 1560 },
    { content: 'Cross-validation > single train/test split. Always use at least 5-fold CV when comparing models.', timestamp: 2100 },
  ],
};

// ---------------------------------------------------------------------------
// SEED FUNCTION
// ---------------------------------------------------------------------------

const seedCourses = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('📦 Connected to MongoDB\n');

    const teacher = await User.findOne({ role: 'teacher' });
    const student = await User.findOne({ role: 'student' });
    if (!teacher) { console.error('❌ No teacher found. Run: npm run seed first'); process.exit(1); }

    const categories = await ExamCategory.find({});
    const catMap = {};
    categories.forEach(c => { catMap[c.slug] = c._id; });

    // Clear existing course content
    await Course.deleteMany({});
    await Quiz.deleteMany({});
    await Discussion.deleteMany({});
    await Note.deleteMany({});
    console.log('🗑️  Cleared existing courses, quizzes, discussions, notes\n');

    const createdCourses = {};

    for (const courseData of coursesData) {
      const { categorySlug, ...rest } = courseData;
      const categoryId = catMap[categorySlug] || categories[0]._id;

      const course = new Course({
        ...rest,
        slug: slugify(rest.title),
        teacher: teacher._id,
        category: categoryId,
        status: 'published',
        isPublished: true,
        isFeatured: true,
        publishedAt: new Date(),
      });

      await course.save();
      createdCourses[course.title] = course;

      const lessonCount = course.sections.reduce((sum, s) => sum + s.lessons.length, 0);
      const durationMin = Math.round(course.totalDuration / 60);
      console.log(`✅ Course: "${course.title}"`);
      console.log(`   Sections: ${course.sections.length} | Lessons: ${lessonCount} | Duration: ~${durationMin} min`);
    }

    // ── Quizzes ───────────────────────────────────────────────────────────────
    console.log('\n📝 Creating quizzes...');
    let totalQuizzes = 0;
    for (const [courseTitle, quizList] of Object.entries(quizzesByCourse)) {
      const course = createdCourses[courseTitle];
      if (!course) continue;

      for (const qData of quizList) {
        await Quiz.create({
          title: qData.title,
          course: course._id,
          teacher: teacher._id,
          questions: qData.questions,
          passingScore: qData.passingScore,
          isPublished: true,
        });
        totalQuizzes++;
        console.log(`   ✅ Quiz: "${qData.title}" → ${course.title}`);
      }
    }

    // ── Discussions ──────────────────────────────────────────────────────────
    console.log('\n💬 Creating discussions...');
    let totalDiscussions = 0;
    for (const [courseTitle, discList] of Object.entries(discussionsByCourse)) {
      const course = createdCourses[courseTitle];
      if (!course) continue;

      for (const dData of discList) {
        await Discussion.create({
          user: student?._id || teacher._id,
          course: course._id,
          title: dData.title,
          content: dData.content,
          tags: dData.tags,
          isPinned: dData.isPinned,
          replies: dData.replies.map(r => ({
            user: teacher._id,
            content: r.content,
            createdAt: new Date(),
          })),
        });
        totalDiscussions++;
        console.log(`   ✅ Discussion: "${dData.title}"`);
      }
    }

    // ── Notes ─────────────────────────────────────────────────────────────────
    console.log('\n📓 Creating notes...');
    let totalNotes = 0;
    for (const [courseTitle, noteList] of Object.entries(notesByCourse)) {
      const course = createdCourses[courseTitle];
      if (!course || !student) continue;

      for (const nData of noteList) {
        await Note.create({
          user: student._id,
          course: course._id,
          content: nData.content,
          timestamp: nData.timestamp,
          color: ['#FFD700', '#90EE90', '#87CEEB', '#FFB6C1'][totalNotes % 4],
        });
        totalNotes++;
      }
      console.log(`   ✅ ${noteList.length} notes → "${courseTitle}"`);
    }

    // ── Summary ──────────────────────────────────────────────────────────────
    console.log('\n' + '─'.repeat(55));
    console.log('🎉 Course content seeded successfully!\n');
    console.log(`📚 Courses:     ${Object.keys(createdCourses).length}`);
    console.log(`📝 Quizzes:     ${totalQuizzes}`);
    console.log(`💬 Discussions: ${totalDiscussions}`);
    console.log(`📓 Notes:       ${totalNotes}`);
    console.log('\nLogin to explore:');
    console.log('   Teacher: teacher@testbook.com / Teacher@123456');
    console.log('   Student: student@testbook.com / Student@123456');

    process.exit(0);
  } catch (err) {
    console.error('❌ Seed error:', err.message);
    console.error(err);
    process.exit(1);
  }
};

seedCourses();
