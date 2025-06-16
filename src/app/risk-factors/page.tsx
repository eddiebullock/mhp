'use client';

import { useState, useEffect } from 'react';
import CollapsibleTable, { Column } from '@/components/tables/CollapsibleTable';
import { Intervention, getInterventions, getInterventionsByCondition } from '@/lib/data/interventions';

const columns: Column<Intervention>[] = [
  {
    key: 'title',
    header: 'Risk Factor',
    sortable: true,
    render: (value: string, item: Intervention) => (
      <div>
        <div className="font-medium text-gray-900">{value}</div>
        <div className="text-gray-500 text-sm mt-1">{item.summary}</div>
        {item.content?.protective_factors && (
          <div className="text-green-600 text-sm mt-1">
            Protective Factors: {item.content.protective_factors}
          </div>
        )}
      </div>
    ),
  },
  {
    key: 'content',
    header: 'Category',
    sortable: true,
    render: (value: any) => {
      const category = value?.category || 'Unknown';
      const colors = {
        Lifestyle: 'bg-blue-100 text-blue-800',
        Environmental: 'bg-green-100 text-green-800',
        Genetic: 'bg-purple-100 text-purple-800',
        Social: 'bg-yellow-100 text-yellow-800',
        Unknown: 'bg-gray-100 text-gray-800',
      };
      return (
        <span
          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
            colors[category as keyof typeof colors]
          }`}
        >
          {category}
        </span>
      );
    },
  },
  {
    key: 'evidenceStrength',
    header: 'Correlation',
    sortable: true,
    render: (value: Intervention['evidenceStrength']) => {
      const colors = {
        Strong: 'bg-red-100 text-red-800',
        Moderate: 'bg-orange-100 text-orange-800',
        Limited: 'bg-yellow-100 text-yellow-800',
        Insufficient: 'bg-gray-100 text-gray-800',
      };
      return (
        <span
          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
            colors[value]
          }`}
        >
          {value}
        </span>
      );
    },
  },
  {
    key: 'studyCount',
    header: 'Studies',
    sortable: true,
    className: 'text-center',
  },
  {
    key: 'reliabilityRating',
    header: 'Reliability',
    sortable: true,
    render: (value: number) => (
      <div className="flex items-center">
        <div className="w-full bg-gray-200 rounded-full h-2.5">
          <div
            className="bg-indigo-600 h-2.5 rounded-full"
            style={{ width: `${value * 20}%` }}
          ></div>
        </div>
        <span className="ml-2 text-sm text-gray-600">{value}/5</span>
      </div>
    ),
  },
];

const filterOptions = [
  { label: 'All Conditions', value: '' },
  { label: 'Depression', value: 'depression' },
  { label: 'Anxiety', value: 'anxiety' },
  { label: 'Mood', value: 'mood' },
  { label: 'PTSD', value: 'ptsd' },
  { label: 'OCD', value: 'ocd' },
];

export default function RiskFactorsPage() {
  const [interventions, setInterventions] = useState<Intervention[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const data = await getInterventions('risk_factor');
        setInterventions(data);
      } catch (err) {
        setError('Failed to load risk factors');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const handleFilterChange = async (filter: string) => {
    setLoading(true);
    try {
      const data = filter
        ? await getInterventionsByCondition('risk_factor', filter)
        : await getInterventions('risk_factor');
      setInterventions(data);
    } catch (err) {
      setError('Failed to filter risk factors');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (error) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-800">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">
          Risk Factors
        </h1>
        <p className="mt-2 text-lg text-gray-600">
          Understanding risk factors is important for prevention and early intervention. 
          Remember that correlation does not imply causation, and many factors can be modified or mitigated.
        </p>
        <div className="mt-4 p-4 bg-blue-50 rounded-lg">
          <p className="text-blue-800 text-sm">
            Note: This information is presented for educational purposes. 
            If you're concerned about your mental health, please consult with a healthcare professional.
          </p>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
        </div>
      ) : (
        <CollapsibleTable
          data={interventions}
          columns={columns}
          title="Risk Factors"
          filterOptions={filterOptions}
          onFilterChange={handleFilterChange}
          className="mb-8"
        />
      )}
    </div>
  );
} 