import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { InputPanelComponent } from './components/input-panel.component';
import { OutputPanelComponent } from './components/output-panel.component';
import { GeneratorService, ThumbnailData } from './services/generator.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, InputPanelComponent, OutputPanelComponent],
  templateUrl: './app.component.html',
})
export class AppComponent {
  generatedPrompt = signal<string | null>(null);
  
  // We can track global loading if we wanted to block the UI, 
  // but we'll let the input panel handle its own loading state visually.
  
  private generator = inject(GeneratorService);

  async onGeneratePrompt(event: {data: ThumbnailData, done: () => void}) {
    const data = event.data;
    let hookText = '';

    try {
      // 1. Get the hook text (either AI or Manual)
      if (data.hasText && data.textMode === 'ai') {
        hookText = await this.generator.generateCatchyHook(data.topic, data.language);
      } else if (data.hasText) {
        hookText = data.customText;
      }

      // 2. Generate the full detailed prompt using Gemini
      // This ensures variety every time even with same inputs
      const finalPrompt = await this.generator.generateDetailedPrompt(data, hookText);
      
      this.generatedPrompt.set(finalPrompt);
    } catch (err) {
      console.error("Error in generation flow", err);
      this.generatedPrompt.set("Error generating prompt. Please try again.");
    } finally {
      // Signal the input panel that we are done processing
      if (event.done) event.done();
    }
  }
}
