import React, { useEffect } from 'react';
import html2pdf from 'html2pdf.js';

export function TestHtml2Pdf() {
  useEffect(() => {
    console.log('html2pdf:', html2pdf);
    try {
      console.log('typeof html2pdf:', typeof html2pdf);
    } catch(e) {
      console.error(e);
    }
  }, []);
  return <div />;
}
