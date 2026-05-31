import React, { useState } from 'react';
import { Send, LineChart, Bell, ArrowRight } from 'lucide-react';
import { Page } from '../types';

interface PopularToolsProps {
  onPageChange: (page: Page) => void;
}

export default function PopularTools({ onPageChange }: PopularToolsProps) {
  const [activeSlide, setActiveSlide] = useState(0);

  const tools = [
    {
      title: 'Money Transfer',
      desc: 'Lorem ipsum dolor sit amet iusn consect tetur adig elitfugit pariatur iusto provid entomo dolor amet.',
      btnText: 'SEND MONEY',
      icon: <Send className="text-[#00c2b2] w-6 h-6" />,
      action: () => onPageChange('Dashboard')
    },
    {
      title: 'Currency Charts',
      desc: 'Lorem ipsum dolor sit amet iusn consect tetur adig elitfugit pariatur iusto provid entomo dolor amet.',
      btnText: 'VIEW CHART',
      icon: <LineChart className="text-[#00c2b2] w-6 h-6" />,
      action: () => onPageChange('Dashboard')
    },
    {
      title: 'Rate Alerts',
      desc: 'Lorem ipsum dolor sit amet iusn consect tetur adig elitfugit pariatur iusto provid entomo dolor amet.',
      btnText: 'CREATE ALERT',
      icon: <Bell className="text-[#00c2b2] w-6 h-6" />,
      action: () => onPageChange('Dashboard')
    }
  ];

  return (
    <section className="py-24 px-6 bg-[#f8fbfa] relative overflow-hidden">
      {/* Decorative vector background */}
      <div className="absolute right-0 top-0 w-96 h-96 rounded-full bg-teal-50/40 blur-3xl -z-10"></div>
      <div className="absolute left-0 bottom-0 w-96 h-96 rounded-full bg-orange-50/20 blur-3xl -z-10"></div>

      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-16">
          <span className="text-xs uppercase tracking-widest font-black text-[#00c2b2]">Popular Currency Tools</span>
          <h2 className="text-3xl md:text-4xl font-black text-slate-800 tracking-tight mt-2 max-w-2xl mx-auto font-display">
            Set Up & Exchange Money From Your Cards In A Minute
          </h2>
        </div>

        {/* Tools Cards Layout */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
          {tools.map((tool, idx) => (
            <div 
              key={idx}
              className={`bg-white rounded-xl p-8 border hover:border-[#00c2b2]/40 shadow-premium transition-all duration-300 hover:-translate-y-1 group relative overflow-hidden ${
                activeSlide === idx ? 'border-[#00c2b2] ring-1 ring-[#00c2b2]/10' : 'border-slate-100'
              }`}
            >
              <div className="w-12 h-12 rounded-lg bg-teal-50 flex items-center justify-center p-3 mb-6 transition-transform group-hover:scale-110 duration-300">
                {tool.icon}
              </div>

              <h3 className="text-xl font-bold text-slate-800 font-display mb-3">{tool.title}</h3>
              <p className="text-sm text-slate-500 leading-relaxed mb-6">{tool.desc}</p>

              <button 
                onClick={tool.action}
                className="flex items-center gap-1.5 text-xs font-black text-[#00c2b2] hover:text-[#00a093] transition-colors mt-auto tracking-wider uppercase group"
              >
                <span>{tool.btnText}</span>
                <ArrowRight size={12} className="group-hover:translate-x-1 transition-transform" />
              </button>

              {/* Accent element */}
              <div className={`absolute bottom-0 inset-x-0 h-1 transition-all duration-300 ${
                activeSlide === idx ? 'bg-[#00c2b2]' : 'bg-transparent group-hover:bg-teal-50/50'
              }`}></div>
            </div>
          ))}
        </div>

        {/* Carousel pagination dots matching screenshots exactly */}
        <div className="flex justify-center items-center gap-2 mt-4">
          {tools.map((_, i) => (
            <button
              key={i}
              onClick={() => setActiveSlide(i)}
              className={`h-2.5 rounded-full transition-all duration-300 ${
                activeSlide === i ? 'w-8 bg-[#00c2b2]' : 'w-2.5 bg-slate-300 hover:bg-slate-400'
              }`}
              title={`Go to slide ${i + 1}`}
            ></button>
          ))}
        </div>
      </div>
    </section>
  );
}
