import type { Topic, Note } from './types';

export const initialTopics: Topic[] = [
  { id: '1', name: 'JavaScript' },
  { id: '2', name: 'CSS' },
  { id: '3', name: 'React' },
  { id: '4', name: 'General Thoughts' },
];

export const initialNotes: Note[] = [
  {
    id: '101',
    topicId: '1',
    title: 'Array Sorting',
    type: 'code',
    content: `const fruits = ["Banana", "Orange", "Apple", "Mango"];\nfruits.sort(); // Sorts the elements of fruits`,
    highlightedContent: `<pre class="language-javascript"><code><span class="token keyword">const</span> fruits <span class="token operator">=</span> <span class="token punctuation">[</span><span class="token string">"Banana"</span><span class="token punctuation">,</span> <span class="token string">"Orange"</span><span class="token punctuation">,</span> <span class="token string">"Apple"</span><span class="token punctuation">,</span> <span class="token string">"Mango"</span><span class="token punctuation">]</span><span class="token punctuation">;</span>\nfruits<span class="token punctuation">.</span><span class="token function">sort</span><span class="token punctuation">(</span><span class="token punctuation">)</span><span class="token punctuation">;</span> <span class="token comment">// Sorts the elements of fruits</span></code></pre>`,
    language: 'javascript',
    createdAt: new Date().toISOString(),
  },
  {
    id: '102',
    topicId: '1',
    title: 'Async/Await',
    type: 'code',
    content: `async function myFunction() {\n  return "Hello";\n}\n// Is equivalent to:\nfunction myFunction() {\n  return Promise.resolve("Hello");\n}`,
    createdAt: new Date().toISOString(),
  },
  {
    id: '201',
    topicId: '2',
    title: 'Flexbox Guide',
    type: 'code',
    content: `.container {\n  display: flex;\n  justify-content: center;\n  align-items: center;\n}`,
    createdAt: new Date().toISOString(),
  },
  {
    id: '301',
    topicId: '3',
    title: 'useState Hook',
    type: 'code',
    content: `import { useState } from 'react';\n\nfunction FavoriteColor() {\n  const [color, setColor] = useState("red");\n\n  return <h1>My favorite color is {color}!</h1>\n}`,
    createdAt: new Date().toISOString(),
  },
  {
    id: '401',
    topicId: '4',
    title: 'Project Ideas',
    type: 'text',
    content: `<h1>Project Brainstorming</h1><p>Here are a few ideas for the next side project:</p><ul><li>A recipe tracking app</li><li>A personal finance dashboard</li><li>A workout logger</li></ul><p>The recipe app seems most interesting. It could use a serverless backend and a modern frontend framework.</p>`,
    createdAt: new Date().toISOString(),
  }
];
