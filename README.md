
  # Resume-Renderer

  Generate a good formatted resume in pdf format given markdown, html, or xml.

  ## Recommended workflow
  1. Format your resume into md, html, or xml.
     - Look at the sample resume for the given format. You can copy paste this into gemini, along with a copy paste of your current resume, and ask gemini to format your resume in the format that matches the sample resume. This will be your formated resume that you can paste into the Resume-Renderer. The `<FormatPageBreak>` tag specifies a page break in html or xml, and `---page-break---` achieves the same thing in markdown.
  2. Tailor your resume for a given job description.
     - In the same gemini window, provide it the job description you want to target. Gemini will tailor it for you in the desired format.
  3. Hit Render and Auto-fit.
     - Auto-fit tries to fit your resume to 1 or 2 pages. If you want to manually tweak the size of things, you can hit `Show Fit Vars` to open a menu.
    
  ## Running the code

  Run `npm ci` to install the dependencies.

  Run `npm run dev` to start the development server.
  
