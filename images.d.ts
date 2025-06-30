declare module '*.png' {
  const value: import('next/dist/shared/lib/get-img-props').StaticImageData;
  export default value;
}
