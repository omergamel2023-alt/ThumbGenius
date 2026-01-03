import { Component, Input, signal, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IconCopy, IconHistory, IconCheck, IconX } from './ui/icons';

@Component({
  selector: 'app-output-panel',
  standalone: true,
  imports: [CommonModule, IconCopy, IconHistory, IconCheck, IconX],
  template: `
    <div class="h-full flex flex-col relative overflow-hidden rounded-2xl">
      
      <!-- Top Bar -->
      <div class="flex justify-between items-center mb-6 z-10">
        <h2 class="text-xl font-bold text-slate-900 tracking-tight drop-shadow-sm text-white md:text-slate-900 mix-blend-difference md:mix-blend-normal">Generated Prompt</h2>
        
        <!-- Enhanced History Button -->
        <button 
          (click)="showHistory.set(true)"
          class="flex items-center gap-2 px-4 py-2 rounded-full bg-slate-900/90 backdrop-blur-md hover:bg-slate-800 text-white font-semibold text-xs uppercase tracking-wider transition-all shadow-lg hover:shadow-xl hover:-translate-y-0.5"
          title="Open History"
        >
          <icon-history></icon-history> <span>History</span>
        </button>
      </div>

      <!-- Main Result Card (Glassmorphism) -->
      <div class="relative group flex-grow transition-all duration-500 z-0">
        <div class="absolute -inset-0.5 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-2xl opacity-20 group-hover:opacity-40 transition duration-500 blur"></div>
        <div class="relative h-full bg-white/80 md:bg-white/60 backdrop-blur-xl border border-white/50 rounded-2xl p-6 shadow-sm flex flex-col">
          
          @if (currentPrompt()) {
            <div class="flex-grow font-mono text-sm text-slate-800 leading-relaxed overflow-y-auto custom-scrollbar whitespace-pre-wrap break-words pr-2">
              {{ currentPrompt() }}
            </div>
            
            <div class="mt-6 pt-4 border-t border-slate-200/60 flex justify-end">
              <button 
                (click)="copyToClipboard(currentPrompt()!)"
                class="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-semibold shadow-lg shadow-indigo-500/30 transition-all active:scale-95"
              >
                @if (copied()) {
                  <icon-check></icon-check> Copied!
                } @else {
                  <icon-copy></icon-copy> Copy Prompt
                }
              </button>
            </div>
          } @else {
            <div class="h-full flex flex-col items-center justify-center text-slate-500 gap-4">
              <div class="p-5 bg-white rounded-full shadow-sm border border-slate-100">
                <icon-copy></icon-copy>
              </div>
              <div class="text-center space-y-1">
                <p class="font-medium text-slate-700">Ready to create magic?</p>
                <p class="text-sm opacity-70">Fill out the brief and hit Generate.</p>
              </div>
            </div>
          }
        </div>
      </div>

      <!-- History Sidebar Drawer (Full Width Overlay) -->
      <div 
        class="absolute inset-0 bg-slate-50 z-40 flex flex-col transition-transform duration-300 ease-in-out"
        [class.translate-x-0]="showHistory()"
        [class.translate-x-full]="!showHistory()"
      >
        <!-- Drawer Header -->
        <div class="p-5 md:p-6 border-b border-slate-200 flex justify-between items-center bg-white shadow-sm flex-shrink-0">
          <div class="flex items-center gap-2 text-slate-800">
            <div class="p-2 bg-indigo-50 rounded-lg text-indigo-600">
               <icon-history></icon-history>
            </div>
            <div>
               <h3 class="font-bold text-lg leading-tight">Prompt History</h3>
               <p class="text-[10px] text-slate-500 font-medium uppercase tracking-wide">Saved Sessions</p>
            </div>
          </div>
          <button 
            (click)="showHistory.set(false)" 
            class="w-10 h-10 flex items-center justify-center rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-700 transition-colors"
          >
            <icon-x></icon-x>
          </button>
        </div>

        <!-- Drawer Content -->
        <div class="flex-1 overflow-y-auto p-4 md:p-8 custom-scrollbar">
           <div class="max-w-4xl mx-auto space-y-4">
               @for (item of history(); track $index) {
                 <div 
                   class="group relative p-5 md:p-6 bg-white border border-slate-200 rounded-xl hover:border-indigo-400 hover:shadow-lg hover:shadow-indigo-500/5 cursor-pointer transition-all duration-200 text-left"
                   (click)="selectHistory(item)"
                 >
                   <div class="flex items-start gap-4">
                      <div class="flex-grow font-mono text-xs md:text-sm text-slate-600 leading-relaxed line-clamp-3 group-hover:text-slate-900 transition-colors">
                        {{ item }}
                      </div>
                      <div class="flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity self-center">
                         <span class="text-xs font-bold text-indigo-600 bg-indigo-50 px-3 py-1 rounded-full">Restore</span>
                      </div>
                   </div>
                 </div>
               }
               @if (history().length === 0) {
                 <div class="h-full flex flex-col items-center justify-center text-slate-400 text-sm p-12 text-center opacity-60">
                   <div class="mb-4 p-4 bg-slate-100 rounded-full"><icon-history></icon-history></div>
                   <p class="font-medium">No history yet.</p>
                   <p class="text-xs mt-1">Your generated prompts will appear here.</p>
                 </div>
               }
           </div>
        </div>
      </div>

    </div>
  `
})
export class OutputPanelComponent implements OnChanges {
  @Input() prompt: string | null = null;
  
  currentPrompt = signal<string | null>(null);
  showHistory = signal(false);
  history = signal<string[]>([]);
  copied = signal(false);

  ngOnChanges(changes: SimpleChanges) {
    if (changes['prompt'] && this.prompt) {
      this.currentPrompt.set(this.prompt);
      // Avoid duplicate consecutive history entries
      const currentHistory = this.history();
      if (currentHistory.length === 0 || currentHistory[0] !== this.prompt) {
         this.history.update(h => [this.prompt!, ...h]);
      }
      this.copied.set(false);
    }
  }

  copyToClipboard(text: string) {
    navigator.clipboard.writeText(text);
    this.copied.set(true);
    setTimeout(() => this.copied.set(false), 2000);
  }

  selectHistory(item: string) {
    this.currentPrompt.set(item);
    this.copied.set(false);
    this.showHistory.set(false); // Auto close sidebar on selection for better mobile UX
  }
}
