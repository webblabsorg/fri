'use client'

import { useEffect } from 'react'

export default function WordAddinFunctions() {
  useEffect(() => {
    // Initialize Office.js functions
    if (typeof window !== 'undefined' && (window as any).Office) {
      (window as any).Office.onReady(() => {
        // Define functions that can be called from ribbon buttons
        if (!(window as any).analyzeSelection) {
          (window as any).analyzeSelection = analyzeSelection
        }
      })
    }
  }, [])

  return (
    <div style={{ display: 'none' }}>
      {/* This page is hidden and only serves to load JavaScript functions */}
      <script
        dangerouslySetInnerHTML={{
          __html: `
            // Function to analyze selected text
            function analyzeSelection(event) {
              Word.run(function (context) {
                var selection = context.document.getSelection();
                selection.load('text');
                
                return context.sync().then(function () {
                  if (selection.text.trim()) {
                    // Show notification
                    Office.ribbon.requestUpdate({
                      tabs: [{
                        id: "TabHome",
                        groups: [{
                          id: "Contoso.Group1",
                          controls: [{
                            id: "Contoso.AnalyzeButton",
                            enabled: false
                          }]
                        }]
                      }]
                    });
                    
                    // In a real implementation, send text to AI service
                    console.log('Analyzing text:', selection.text);
                    
                    // Show task pane with results
                    Office.addin.showAsTaskpane();
                    
                    // Complete the event
                    event.completed();
                  } else {
                    // Show error message
                    Office.addin.showAsTaskpane();
                    event.completed();
                  }
                });
              }).catch(function (error) {
                console.error('Error analyzing selection:', error);
                event.completed();
              });
            }
            
            // Make function globally available
            window.analyzeSelection = analyzeSelection;
          `
        }}
      />
    </div>
  )
}

// Function definitions for TypeScript
declare global {
  interface Window {
    analyzeSelection: (event: any) => void
    Office: any
    Word: any
  }
}

function analyzeSelection(event: any) {
  if (typeof window !== 'undefined' && (window as any).Word) {
    (window as any).Word.run(async (context: any) => {
      const selection = context.document.getSelection()
      selection.load('text')
      
      await context.sync()
      
      if (selection.text.trim()) {
        // In a real implementation, send to AI service
        console.log('Analyzing text:', selection.text)
        
        // Show task pane
        if ((window as any).Office?.addin?.showAsTaskpane) {
          (window as any).Office.addin.showAsTaskpane()
        }
      }
      
      event.completed()
    }).catch((error: any) => {
      console.error('Error analyzing selection:', error)
      event.completed()
    })
  } else {
    event.completed()
  }
}
