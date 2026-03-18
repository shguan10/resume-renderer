/// <reference types="vite/client" />
declare module '*.css';
declare module '*.xml?raw' {
  const content: string;
  export default content;
}