// components/ComplianceCard.tsx
import React from 'react';
import { BranchComplianceData } from './GoalComplianceDashboard';
import { TrendingUp, TrendingDown, ArrowRight, Award, ShieldAlert, CheckCircle2 } from 'lucide-react';

interface ComplianceCardProps {
  data: BranchComplianceData;
  rank: number;
  rankingContext: 'all' | 'top' | 'bottom';
}

const TrendIndicator: React.FC<{ trend: 'up' | 'down' | 'stable' }> = React.memo(({ trend }) => {
  const styles = {
    up: {
      bg: 'bg-green-100',
      text: 'text-green-700',
      icon: <TrendingUp className="w-4 h-4 mr-1.5"/>,
      label: 'Tendencia positiva'
    },
    down: {
      bg: 'bg-red-100',
      text: 'text-red-700',
      icon: <TrendingDown className="w-4 h-4 mr-1.5"/>,
      label: 'Tendencia negativa'
    },
    stable: {
      bg: 'bg-gray-100',
      text: 'text-gray-600',
      icon: <ArrowRight className="w-4 h-4 mr-1.5"/>,
      label: 'Estable'
    }
  };
  const currentStyle = styles[trend];

  return (
    <div className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${currentStyle.bg} ${currentStyle.text}`}>
      {currentStyle.icon}
      {currentStyle.label}
    </div>
  );
});

const RankIcon: React.FC<{ rank: number, context: 'top' | 'bottom' | 'all' }> = ({rank, context}) => {
    if (context === 'top' || (context === 'all' && rank <=3)) {
        const colors = ['text-yellow-400', 'text-gray-400', 'text-orange-500'];
        if (rank > 0 && rank <= 3) {
            return <Award className={`w-5 h-5 ${colors[rank-1]}`} />;
        }
    }
    if (context === 'bottom') {
         return <ShieldAlert className="w-5 h-5 text-red-500" />;
    }
    return <div className="text-pizarro-blue-600 font-bold text-sm">#{rank}</div>;
}

const ComplianceCard: React.FC<ComplianceCardProps> = ({ data, rank, rankingContext }) => {
  const { branchName, avgCompliance, pctMonthsMet, trend, status, monthsMet, totalMonths } = data;

  const statusClasses = {
    green: {
      border: 'border-green-500',
      text: 'text-green-600',
      bg: 'bg-green-500',
      bgLight: 'bg-green-100',
    },
    yellow: {
      border: 'border-yellow-500',
      text: 'text-yellow-600',
      bg: 'bg-yellow-500',
      bgLight: 'bg-yellow-100',
    },
    red: {
      border: 'border-red-500',
      text: 'text-red-600',
      bg: 'bg-red-500',
      bgLight: 'bg-red-100',
    },
  };
  const classes = statusClasses[status];
  const thermometerHeight = Math.min(avgCompliance, 120); // Cap height at 120% for visual sanity

  return (
    <div className={`bg-white p-4 rounded-xl shadow-lg border-l-4 ${classes.border} flex flex-col justify-between transition-all hover:shadow-xl hover:scale-[1.02]`}>
        <div>
            <div className="flex justify-between items-start mb-2">
                 <div>
                    <h3 className="font-bold text-pizarro-blue-800 text-lg pr-2 mb-1.5">{branchName.replace('SUCURSAL', '').trim()}</h3>
                    <TrendIndicator trend={trend} />
                </div>
                <div className="flex-shrink-0">
                    <RankIcon rank={rank} context={rankingContext} />
                </div>
            </div>

            <div className="flex items-end justify-center gap-6 my-4">
                {/* Thermometer */}
                <div className="flex flex-col items-center">
                    <div className="w-8 h-36 bg-gray-200 rounded-full flex flex-col-reverse p-1">
                        <div 
                            className={`${classes.bg} rounded-full transition-all duration-700 ease-out`}
                            style={{ height: `${thermometerHeight}%` }}
                        ></div>
                    </div>
                    <div className={`w-10 h-10 -mt-5 rounded-full ${classes.bg} border-4 border-white`}></div>
                </div>

                {/* Percentage */}
                <div className="text-left">
                    <p className={`text-6xl font-bold ${classes.text}`} style={{lineHeight: 1}}>
                        {avgCompliance.toFixed(0)}<span className="text-4xl">%</span>
                    </p>
                    <p className="text-sm text-gray-500 -mt-1">Cumplimiento Promedio</p>
                </div>
            </div>
        </div>

      <div className={`p-3 rounded-lg ${classes.bgLight} mt-4 text-center`}>
        <div className="flex items-center justify-center text-sm font-medium text-gray-700">
          <CheckCircle2 className="w-4 h-4 mr-1.5 text-gray-500"/>
          <span>Consistencia de Cumplimiento</span>
        </div>
        <p className={`text-3xl font-bold ${classes.text} mt-1`}>
            {pctMonthsMet.toFixed(0)}%
        </p>
        <p className="text-xs text-gray-500">
            ({monthsMet} de {totalMonths} meses por encima del objetivo)
        </p>
      </div>
    </div>
  );
};

export default React.memo(ComplianceCard);