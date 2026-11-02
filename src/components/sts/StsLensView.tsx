import React from 'react';
import { useGeometryStore, StsCaseStudyId } from '../../store/geometryStore';
import { CaseStudyHistory } from './CaseStudyHistory';
import { CaseStudyNavigation } from './CaseStudyNavigation';
import { CaseStudyGravity } from './CaseStudyGravity';
import { CaseStudyModels } from './CaseStudyModels';
import { History, Globe, Orbit, Scale, ArrowLeft } from 'lucide-react';

export const StsLensView: React.FC = () => {
  const { activeStsCaseStudy, setStsCaseStudy, setAppSection } = useGeometryStore();

  const caseStudies: { id: StsCaseStudyId; label: string; icon: React.ReactNode; subtitle: string }[] = [
    {
      id: 'history',
      label: '1. History & Revolution',
      icon: <History className="w-4 h-4" />,
      subtitle: 'Euclid to Riemann & Bolyai',
    },
    {
      id: 'navigation',
      label: '2. Navigation & Maps',
      icon: <Globe className="w-4 h-4" />,
      subtitle: 'Great Circles vs Mercator',
    },
    {
      id: 'gravity',
      label: '3. Geometry & Gravity',
      icon: <Orbit className="w-4 h-4" />,
      subtitle: 'Spacetime & Light Deflection',
    },
    {
      id: 'models',
      label: '4. Models & Representation',
      icon: <Scale className="w-4 h-4" />,
      subtitle: 'Intrinsic vs Extrinsic Reality',
    },
  ];

  return (
    <div className="w-full h-full bg-[#090A0D] text-[#E8EAF0] flex flex-col overflow-hidden select-none">
      {/* STS Lens Subheader Navigation */}
      <div className="h-14 bg-[#12141A] border-b border-[#292C35] px-6 flex items-center justify-between shrink-0 z-10">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setAppSection('lab')}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg bg-[#181B22] hover:bg-[#202530] text-[#858B9A] hover:text-[#E8EAF0] border border-[#292C35] transition"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Return to 3D Lab</span>
          </button>
          <div className="w-[1px] h-5 bg-[#292C35]" />
          <span className="text-xs font-mono font-bold text-[#69A3FF] uppercase tracking-wider">
            STS Lens · Science, Technology & Society
          </span>
        </div>

        {/* Case Study Tabs */}
        <div className="flex gap-1.5 bg-[#0D0F14] p-1 rounded-xl border border-[#292C35]">
          {caseStudies.map((cs) => {
            const active = activeStsCaseStudy === cs.id;
            return (
              <button
                key={cs.id}
                onClick={() => setStsCaseStudy(cs.id)}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition ${
                  active
                    ? 'bg-[#181B22] text-[#69A3FF] border border-[#69A3FF]/40 font-semibold shadow-sm'
                    : 'text-[#858B9A] hover:text-[#E8EAF0]'
                }`}
              >
                {cs.icon}
                <span className="hidden sm:inline">{cs.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Case Study Content Area with independent scroll */}
      <div className="flex-1 overflow-y-auto px-6 py-4">
        {activeStsCaseStudy === 'history' && <CaseStudyHistory />}
        {activeStsCaseStudy === 'navigation' && <CaseStudyNavigation />}
        {activeStsCaseStudy === 'gravity' && <CaseStudyGravity />}
        {activeStsCaseStudy === 'models' && <CaseStudyModels />}
      </div>
    </div>
  );
};

