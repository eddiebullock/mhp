'use client';

import { useState, useEffect } from 'react';
import CollapsibleTable, { Column } from '@/components/tables/CollapsibleTable';
import { Intervention, getInterventions, getInterventionsByCondition } from '@/lib/data/interventions';

const columns: Column<Intervention>[] = [
  {
    key: 'title',
    header: 'Intervention',
    sortable: true,
    render: (value: string, item: Intervention) => (
      <div>
        <div className="font-medium text-gray-900">{value}</div>
        <div className="text-gray-500 text-sm mt-1">{item.summary}</div>
      </div>
    ),
  },
  {
    key: 'evidenceStrength',
    header: 'Evidence Strength',
    sortable: true,
    render: (value: Intervention['evidenceStrength']) => {
      const colors = {
        Strong: 'bg-green-100 text-green-800',
        Moderate: 'bg-blue-100 text-blue-800',
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
  { label: 'General Wellbeing', value: 'wellbeing' },
  { label: 'PTSD', value: 'ptsd' },
  { label: 'OCD', value: 'ocd' },
];

export default function LifestylePage() {
  const [interventions, setInterventions] = useState<Intervention[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const data = await getInterventions('lifestyle');
        setInterventions(data);
      } catch (err) {
        setError('Failed to load lifestyle interventions');
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
        ? await getInterventionsByCondition('lifestyle', filter)
        : await getInterventions('lifestyle');
      setInterventions(data);
    } catch (err) {
      setError('Failed to filter lifestyle interventions');
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
          Lifestyle Interventions
        </h1>
        <p className="mt-2 text-lg text-gray-600">
          Evidence-based lifestyle changes ranked by scientific support and effectiveness
        </p>
      </div>

      {loading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
        </div>
      ) : (
        <CollapsibleTable
          data={interventions}
          columns={columns}
          title="Lifestyle Interventions"
          filterOptions={filterOptions}
          onFilterChange={handleFilterChange}
          className="mb-8"
        />
      )}
    </div>
  );
} 