declare module 'mjml' {
  const mjml2html: (mjml: string, options?: any) => { html: string; errors?: any[] }
  export default mjml2html
}


