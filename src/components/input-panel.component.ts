import { Component, EventEmitter, Output, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IconSparkles, IconImage, IconLoader, IconChevronDown, IconCheck, IconAspectRatio, IconCamera, IconPalette } from './ui/icons';
import { GeneratorService, ThumbnailData } from '../services/generator.service';

@Component({
  selector: 'app-input-panel',
  standalone: true,
  imports: [CommonModule, FormsModule, IconSparkles, IconImage, IconLoader, IconChevronDown, IconCheck, IconAspectRatio, IconCamera, IconPalette],
  template: `
    <!-- 
      On Desktop: h-full with custom scrollbar.
      On Mobile: h-auto (natural height) so it scrolls with the page.
    -->
    <div class="flex flex-col gap-6 p-1 h-auto md:h-full overflow-visible md:overflow-y-auto custom-scrollbar pb-8 md:pb-1">
      
      <!-- Topic Input -->
      <div class="space-y-2">
        <label class="block text-sm font-medium text-slate-700">Topic / Idea</label>
        <textarea 
          class="w-full p-4 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all shadow-sm text-slate-800 placeholder:text-slate-400 resize-none text-base"
          [class.h-28]="true"
          rows="4"
          placeholder="Describe your video (e.g. 'I survived 50 hours in Antarctica')"
          [(ngModel)]="topic"
        ></textarea>
      </div>

      <!-- Reference Image -->
      <div class="space-y-2">
        <label class="block text-sm font-medium text-slate-700">Reference Vibe (Optional)</label>
        <div 
          class="relative group cursor-pointer border-2 border-dashed border-slate-300 rounded-xl p-4 transition-all hover:border-indigo-400 hover:bg-slate-50 flex flex-col items-center justify-center text-center gap-2 min-h-[100px]"
          [class.border-indigo-500]="hasImage()"
          [class.bg-indigo-50]="hasImage()"
          (dragover)="onDragOver($event)"
          (drop)="onDrop($event)"
          (click)="fileInput.click()"
        >
          <input #fileInput type="file" class="hidden" (change)="onFileSelected($event)" accept="image/*">
          
          @if (isAnalyzing()) {
            <div class="animate-spin text-indigo-600"><icon-loader></icon-loader></div>
            <span class="text-xs text-indigo-600 font-medium">Extracting aesthetic...</span>
          } @else if (hasImage()) {
            <div class="text-indigo-600"><icon-check></icon-check></div>
            <span class="text-xs text-indigo-700 font-medium">Style extracted!</span>
            
            @if (imageAnalysisResult()) {
              <div class="mt-2 w-full text-[10px] text-slate-600 bg-white/50 p-2 rounded border border-indigo-100 text-left leading-relaxed">
                <span class="font-bold text-indigo-700">AI Analysis:</span> {{ imageAnalysisResult() }}
              </div>
            }

            <button (click)="removeImage($event)" class="mt-2 text-[10px] text-red-500 underline z-10 hover:text-red-600">Remove Image</button>
          } @else {
            <div class="text-slate-400 group-hover:text-indigo-500 transition-colors"><icon-image></icon-image></div>
            <span class="text-xs text-slate-500">Drop reference image to steal its style</span>
          }
        </div>
      </div>

      <!-- Text Controls -->
      <div class="bg-white rounded-xl border border-slate-200 p-4 shadow-sm space-y-3">
        <div class="flex items-center justify-between">
          <span class="text-sm font-medium text-slate-700">Text Overlay</span>
          <button 
            type="button" 
            class="relative inline-flex h-5 w-9 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none"
            [class.bg-indigo-600]="hasText()"
            [class.bg-slate-200]="!hasText()"
            (click)="toggleText()"
          >
            <span 
              class="pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out"
              [class.translate-x-4]="hasText()"
              [class.translate-x-0]="!hasText()"
            ></span>
          </button>
        </div>

        @if (hasText()) {
          <div class="space-y-3 pt-2 border-t border-slate-100">
             <div class="flex gap-2 bg-slate-100 p-1 rounded-lg">
                <button 
                  class="flex-1 py-1.5 text-xs font-medium rounded-md transition-all"
                  [class.bg-white]="textMode() === 'manual'"
                  [class.shadow-sm]="textMode() === 'manual'"
                  [class.text-slate-900]="textMode() === 'manual'"
                  [class.text-slate-500]="textMode() !== 'manual'"
                  (click)="textMode.set('manual')"
                >Manual</button>
                <button 
                  class="flex-1 py-1.5 text-xs font-medium rounded-md transition-all flex items-center justify-center gap-1"
                  [class.bg-white]="textMode() === 'ai'"
                  [class.shadow-sm]="textMode() === 'ai'"
                  [class.text-indigo-600]="textMode() === 'ai'"
                  [class.text-slate-500]="textMode() !== 'ai'"
                  (click)="textMode.set('ai')"
                >
                  <icon-sparkles></icon-sparkles> AI Hook
                </button>
             </div>

             @if (textMode() === 'manual') {
               <input 
                 type="text" 
                 class="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:ring-1 focus:ring-indigo-500 outline-none"
                 placeholder="Enter text..."
                 [(ngModel)]="customText"
               >
             }

             <div>
               <label class="text-[10px] text-slate-400 mb-1 block uppercase tracking-wider font-semibold">Language</label>
               <select 
                 class="w-full px-2 py-2 text-sm bg-white border border-slate-200 rounded-lg outline-none focus:border-indigo-500"
                 [(ngModel)]="language"
               >
                 <option value="English">English</option>
                 <option value="Spanish">Spanish</option>
                 <option value="French">French</option>
                 <option value="German">German</option>
                 <option value="Hindi">Hindi</option>
                 <option value="Arabic">Arabic</option>
               </select>
             </div>
          </div>
        }
      </div>

      <!-- Vibe Controls -->
      <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <!-- Emotion -->
        <div class="space-y-1">
          <label class="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">Emotion</label>
          <div class="relative">
            <select class="w-full px-2 py-2 text-sm bg-white border border-slate-200 rounded-lg appearance-none focus:ring-1 focus:ring-indigo-500 outline-none" [(ngModel)]="emotion">
              <option>Shocked / Surprised</option>
              <option>Determined / Serious</option>
              <option>Laughing / Joyful</option>
              <option>Mysterious / Hidden</option>
              <option>Angry / Frustrated</option>
              <option>Crying / Sad</option>
            </select>
            <div class="absolute right-3 top-2.5 text-slate-400 pointer-events-none"><icon-chevron-down></icon-chevron-down></div>
          </div>
        </div>

        <!-- Lighting -->
        <div class="space-y-1">
          <label class="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">Lighting</label>
          <div class="relative">
            <select class="w-full px-2 py-2 text-sm bg-white border border-slate-200 rounded-lg appearance-none focus:ring-1 focus:ring-indigo-500 outline-none" [(ngModel)]="lighting">
              <option>High Contrast (Punchy)</option>
              <option>Neon / Cyberpunk</option>
              <option>Professional Softbox</option>
              <option>Golden Hour (Warm)</option>
              <option>Dark & Moody</option>
              <option>Bright & Clean</option>
            </select>
             <div class="absolute right-3 top-2.5 text-slate-400 pointer-events-none"><icon-chevron-down></icon-chevron-down></div>
          </div>
        </div>
        
        <!-- Composition -->
        <div class="space-y-1 sm:col-span-2">
          <label class="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">Composition</label>
          <div class="relative">
             <select class="w-full px-2 py-2 text-sm bg-white border border-slate-200 rounded-lg appearance-none focus:ring-1 focus:ring-indigo-500 outline-none" [(ngModel)]="composition">
              <option>Close-up Face + Background Object</option>
              <option>Split Screen (Before/After)</option>
              <option>Wide Angle Action Shot</option>
              <option>3D Object Focus (No Face)</option>
              <option>Point of View (POV)</option>
            </select>
             <div class="absolute right-3 top-2.5 text-slate-400 pointer-events-none"><icon-chevron-down></icon-chevron-down></div>
          </div>
        </div>

        <!-- Camera Angle (New) -->
        <div class="space-y-1">
          <label class="text-[10px] text-slate-400 font-semibold uppercase tracking-wider flex items-center gap-1">
             <icon-camera></icon-camera> Camera
          </label>
          <div class="relative">
             <select class="w-full px-2 py-2 text-sm bg-white border border-slate-200 rounded-lg appearance-none focus:ring-1 focus:ring-indigo-500 outline-none" [(ngModel)]="cameraAngle">
              <option>Wide Angle (16mm)</option>
              <option>Standard Portrait (50mm)</option>
              <option>Telephoto / Zoom (85mm)</option>
              <option>Low Angle (Heroic)</option>
              <option>High Angle / Drone</option>
              <option>Fish Eye (Distorted)</option>
            </select>
             <div class="absolute right-3 top-2.5 text-slate-400 pointer-events-none"><icon-chevron-down></icon-chevron-down></div>
          </div>
        </div>

        <!-- Art Style (New) -->
        <div class="space-y-1">
          <label class="text-[10px] text-slate-400 font-semibold uppercase tracking-wider flex items-center gap-1">
             <icon-palette></icon-palette> Art Style
          </label>
          <div class="relative">
             <select class="w-full px-2 py-2 text-sm bg-white border border-slate-200 rounded-lg appearance-none focus:ring-1 focus:ring-indigo-500 outline-none" [(ngModel)]="artStyle">
              <option>Hyper-Realistic (Photo)</option>
              <option>3D Render (Pixar/Blender)</option>
              <option>Unreal Engine 5</option>
              <option>Anime / Illustration</option>
              <option>Oil Painting</option>
              <option>Vector Art (Clean)</option>
            </select>
             <div class="absolute right-3 top-2.5 text-slate-400 pointer-events-none"><icon-chevron-down></icon-chevron-down></div>
          </div>
        </div>

        <!-- Aspect Ratio -->
        <div class="space-y-1 sm:col-span-2">
          <label class="text-[10px] text-slate-400 font-semibold uppercase tracking-wider flex items-center gap-1">
            <icon-aspect-ratio></icon-aspect-ratio> Aspect Ratio
          </label>
          <div class="flex gap-2">
            @for (ratio of aspectRatios; track ratio) {
              <button 
                class="flex-1 py-1.5 text-xs font-medium border rounded-lg transition-all"
                [class.bg-indigo-50]="aspectRatio() === ratio"
                [class.border-indigo-200]="aspectRatio() === ratio"
                [class.text-indigo-700]="aspectRatio() === ratio"
                [class.border-slate-200]="aspectRatio() !== ratio"
                [class.text-slate-600]="aspectRatio() !== ratio"
                (click)="aspectRatio.set(ratio)"
              >
                {{ ratio }}
              </button>
            }
          </div>
        </div>

      </div>

      <!-- Generate Button -->
      <div class="mt-4 pb-2">
        <button 
          class="w-full py-3.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl font-semibold shadow-lg shadow-slate-900/20 active:scale-[0.98] transition-all flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
          [disabled]="isGenerating() || !topic()"
          (click)="onGenerate()"
        >
          @if (isGenerating()) {
             <icon-loader></icon-loader> Crafting Prompt...
          } @else {
             <icon-sparkles></icon-sparkles> Generate Prompt
          }
        </button>
      </div>

    </div>
  `
})
export class InputPanelComponent {
  topic = signal('');
  hasText = signal(true);
  textMode = signal<'manual' | 'ai'>('ai');
  customText = signal('');
  language = signal('English');
  emotion = signal('Shocked / Surprised');
  lighting = signal('High Contrast (Punchy)');
  composition = signal('Close-up Face + Background Object');
  cameraAngle = signal('Wide Angle (16mm)');
  artStyle = signal('Hyper-Realistic (Photo)');
  aspectRatio = signal('16:9');
  
  aspectRatios = ['16:9', '9:16', '1:1', '4:3'];
  
  hasImage = signal(false);
  isAnalyzing = signal(false);
  isGenerating = signal(false);
  imageAnalysisResult = signal<string | undefined>(undefined);

  @Output() generate = new EventEmitter<{data: ThumbnailData, done: () => void}>();

  private generatorService = inject(GeneratorService);

  toggleText() {
    this.hasText.update(v => !v);
  }

  async onGenerate() {
    if (!this.topic()) return;
    
    this.isGenerating.set(true);

    const data: ThumbnailData = {
      topic: this.topic(),
      hasText: this.hasText(),
      textMode: this.textMode(),
      customText: this.customText(),
      language: this.language(),
      emotion: this.emotion(),
      lighting: this.lighting(),
      composition: this.composition(),
      cameraAngle: this.cameraAngle(),
      artStyle: this.artStyle(),
      aspectRatio: this.aspectRatio(),
      referenceImageAnalysis: this.imageAnalysisResult()
    };

    this.generate.emit({ 
      data, 
      done: () => {
        this.isGenerating.set(false);
      }
    });
  }

  onDragOver(event: DragEvent) {
    event.preventDefault();
    event.stopPropagation();
  }

  onDrop(event: DragEvent) {
    event.preventDefault();
    event.stopPropagation();
    const files = event.dataTransfer?.files;
    if (files && files.length > 0) {
      this.handleFile(files[0]);
    }
  }

  onFileSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      this.handleFile(input.files[0]);
    }
  }

  async handleFile(file: File) {
    if (!file.type.startsWith('image/')) return;
    
    this.isAnalyzing.set(true);
    
    const reader = new FileReader();
    reader.onload = async (e) => {
      const base64 = e.target?.result as string;
      try {
        const analysis = await this.generatorService.analyzeImageStyle(base64);
        this.imageAnalysisResult.set(analysis);
        this.hasImage.set(true);
      } catch (err) {
        console.error(err);
      } finally {
        this.isAnalyzing.set(false);
      }
    };
    reader.readAsDataURL(file);
  }

  removeImage(e: Event) {
    e.stopPropagation();
    this.hasImage.set(false);
    this.imageAnalysisResult.set(undefined);
  }
}
