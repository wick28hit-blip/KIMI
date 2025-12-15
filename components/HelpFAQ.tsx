import React, { useState } from 'react';
import { ArrowLeft, HelpCircle, ChevronDown, ChevronUp, Shield, Lock, Activity, Calendar } from 'lucide-react';

interface HelpFAQProps {
  onClose: () => void;
}

interface FAQItem {
  question: string;
  answer: string;
  icon?: React.ReactNode;
}

const FAQS: FAQItem[] = [
  {
    question: "Is my data private?",
    answer: "Yes, absolutely. KIMI is designed with a privacy-first approach. All your data is encrypted and stored locally on your device. We do not have access to your personal health information.",
    icon: <Lock size={18} className="text-green-500" />
  },
  {
    question: "How do I log my period?",
    answer: "Go to the 'Daily Log' by tapping the large '+' button at the bottom center. Under the 'General' tab, you can select your flow intensity if it is a period day. This will automatically update your cycle history.",
    icon: <Calendar size={18} className="text-purple-500" />
  },
  {
    question: "How are predictions calculated?",
    answer: "We use your average cycle length and period duration to project future dates. If you log symptoms like high stress or poor sleep, our AI adjusts the prediction to account for potential delays caused by these factors.",
    icon: <Activity size={18} className="text-[#E84C7C]" />
  },
  {
    question: "What do the colors on the dashboard mean?",
    answer: "Pink represents your Menstrual phase. Purple indicates your Fertile Window and Ovulation. Light Pink indicates the Luteal phase. The ring progress shows where you currently are in your cycle.",
    icon: <div className="w-4 h-4 rounded-full bg-gradient-to-br from-pink-400 to-purple-500" />
  },
  {
    question: "Can I export my data?",
    answer: "Yes. In the Settings menu under 'Privacy & Security', tap 'Export Data'. This will download a secure JSON file containing your logs and profile information, which you can use for backups or transferring to another device.",
    icon: <Shield size={18} className="text-blue-500" />
  },
  {
    question: "How do I change my PIN?",
    answer: "Currently, the PIN is set during profile creation. To change it, you would need to reset the application data via the 'Danger Zone' in settings and set up a new profile. We are working on a direct PIN change feature for a future update.",
    icon: <Lock size={18} className="text-orange-500" />
  }
];

const HelpFAQ: React.FC<HelpFAQProps> = ({ onClose }) => {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  const toggleIndex = (index: number) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  return (
    <div className="flex flex-col h-full bg-[#FFF0F3] dark:bg-gray-900 overflow-hidden animate-in slide-in-from-right duration-300">
      
      {/* Header */}
      <div className="p-6 pb-2 flex items-center gap-4 mb-4 shrink-0">
        <button 
          onClick={onClose} 
          className="p-2 -ml-2 rounded-full hover:bg-black/5 dark:hover:bg-white/10 transition-colors"
        >
          <ArrowLeft size={24} className="text-[#2D2D2D] dark:text-white" />
        </button>
        <h2 className="text-2xl font-bold text-[#2D2D2D] dark:text-white">Help & Support</h2>
      </div>

      <div className="flex-1 overflow-y-auto no-scrollbar p-6 pt-0 pb-32">
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-pink-50 dark:border-gray-700 overflow-hidden">
          
          {/* Intro Banner */}
          <div className="p-6 bg-gradient-to-br from-pink-50 to-white dark:from-gray-700 dark:to-gray-800 border-b border-pink-50 dark:border-gray-700">
             <div className="flex items-center gap-4">
               <div className="p-3 bg-white dark:bg-gray-600 rounded-full shadow-sm text-[#E84C7C]">
                 <HelpCircle size={28} />
               </div>
               <div>
                 <h3 className="font-bold text-gray-800 dark:text-white">Frequently Asked Questions</h3>
                 <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                   Find answers to common questions about using KIMI.
                 </p>
               </div>
             </div>
          </div>

          {/* Accordion List */}
          <div className="divide-y divide-gray-50 dark:divide-gray-700">
            {FAQS.map((faq, idx) => {
              const isOpen = openIndex === idx;
              return (
                <div key={idx} className="transition-colors hover:bg-gray-50 dark:hover:bg-gray-700/50">
                  <button 
                    onClick={() => toggleIndex(idx)}
                    className="w-full p-4 flex items-center justify-between text-left"
                  >
                    <div className="flex items-center gap-3">
                      {faq.icon && <div className="shrink-0 opacity-80">{faq.icon}</div>}
                      <span className={`font-medium text-sm transition-colors ${isOpen ? 'text-[#E84C7C]' : 'text-gray-700 dark:text-gray-200'}`}>
                        {faq.question}
                      </span>
                    </div>
                    {isOpen ? (
                      <ChevronUp size={16} className="text-[#E84C7C]" />
                    ) : (
                      <ChevronDown size={16} className="text-gray-400" />
                    )}
                  </button>
                  
                  {isOpen && (
                    <div className="px-4 pb-4 pl-12 animate-in slide-in-from-top-2 duration-200">
                      <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed bg-pink-50/50 dark:bg-gray-900/30 p-3 rounded-lg">
                        {faq.answer}
                      </p>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Contact / Extra Help Placeholder */}
        <div className="mt-8 text-center">
          <p className="text-xs text-gray-400 mb-2">Still need help?</p>
          <button className="text-sm font-bold text-[#E84C7C] hover:underline">
            Contact Support
          </button>
        </div>
      </div>
    </div>
  );
};

export default HelpFAQ;