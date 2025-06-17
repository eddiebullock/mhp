'use client';

import { useState, useEffect } from 'react';
import CollapsibleTable, { Column } from '@/components/tables/CollapsibleTable';
import { Intervention, getInterventions, getInterventionsByCondition } from '@/lib/data/interventions';
import Link from 'next/link';

type TabType = 'lifestyle' | 'clinical' | 'risk_factor';

const columns: Record<TabType, Column<Intervention>[]> = {
  lifestyle: [
    {
      key: 'title',
      header: 'Intervention',
      sortable: true,
      render: (value: any, item: Intervention) => (
        <div>
          <Link href={`/articles/${item.slug}`} className="font-medium text-indigo-600 hover:text-indigo-800">
            {String(value)}
          </Link>
          <div className="text-gray-500 text-sm mt-1">{item.summary}</div>
        </div>
      ),
    },
    {
      key: 'evidenceStrength',
      header: 'Evidence Strength',
      sortable: true,
      render: (value: any, item: Intervention) => {
        const strength = item.evidenceStrength;
        const colors = {
          Strong: 'bg-green-100 text-green-800',
          Moderate: 'bg-blue-100 text-blue-800',
          Limited: 'bg-yellow-100 text-yellow-800',
          Insufficient: 'bg-gray-100 text-gray-800',
        };
        return (
          <span
            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
              colors[strength]
            }`}
          >
            {strength}
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
      render: (value: any, item: Intervention) => {
        const rating = item.reliabilityRating;
        return (
          <div className="flex items-center">
            <div className="w-full bg-gray-200 rounded-full h-2.5">
              <div
                className="bg-indigo-600 h-2.5 rounded-full"
                style={{ width: `${rating * 20}%` }}
              ></div>
            </div>
            <span className="ml-2 text-sm text-gray-600">{rating}/5</span>
          </div>
        );
      },
    },
  ],
  clinical: [
    {
      key: 'title',
      header: 'Intervention',
      sortable: true,
      render: (value: any, item: Intervention) => (
        <div>
          <Link href={`/articles/${item.slug}`} className="font-medium text-indigo-600 hover:text-indigo-800">
            {String(value)}
          </Link>
          <div className="text-gray-500 text-sm mt-1">{item.summary}</div>
          {item.content?.risks_and_limitations && (
            <div className="text-red-500 text-sm mt-1">
              Side Effects: {item.content.risks_and_limitations}
            </div>
          )}
        </div>
      ),
    },
    {
      key: 'content',
      header: 'Type',
      sortable: true,
      render: (value: any, item: Intervention) => {
        const type = value?.type || 'Unknown';
        const colors = {
          Therapy: 'bg-purple-100 text-purple-800',
          Medication: 'bg-blue-100 text-blue-800',
          Combined: 'bg-indigo-100 text-indigo-800',
          Alternative: 'bg-green-100 text-green-800',
          Unknown: 'bg-gray-100 text-gray-800',
        };
        return (
          <span
            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
              colors[type as keyof typeof colors]
            }`}
          >
            {type}
          </span>
        );
      },
    },
    {
      key: 'evidenceStrength',
      header: 'Evidence Strength',
      sortable: true,
      render: (value: any, item: Intervention) => {
        const strength = item.evidenceStrength;
        const colors = {
          Strong: 'bg-green-100 text-green-800',
          Moderate: 'bg-blue-100 text-blue-800',
          Limited: 'bg-yellow-100 text-yellow-800',
          Insufficient: 'bg-gray-100 text-gray-800',
        };
        return (
          <span
            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
              colors[strength]
            }`}
          >
            {strength}
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
      render: (value: any, item: Intervention) => {
        const rating = item.reliabilityRating;
        return (
          <div className="flex items-center">
            <div className="w-full bg-gray-200 rounded-full h-2.5">
              <div
                className="bg-indigo-600 h-2.5 rounded-full"
                style={{ width: `${rating * 20}%` }}
              ></div>
            </div>
            <span className="ml-2 text-sm text-gray-600">{rating}/5</span>
          </div>
        );
      },
    },
  ],
  risk_factor: [
    {
      key: 'title',
      header: 'Risk Factor',
      sortable: true,
      render: (value: any, item: Intervention) => (
        <div>
          <Link href={`/articles/${item.slug}`} className="font-medium text-indigo-600 hover:text-indigo-800">
            {String(value)}
          </Link>
          <div className="text-gray-500 text-sm mt-1">{item.summary}</div>
        </div>
      ),
    },
    {
      key: 'content',
      header: 'Category',
      sortable: true,
      render: (value: any, item: Intervention) => {
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
      render: (value: any, item: Intervention) => {
        const strength = item.evidenceStrength;
        const colors = {
          Strong: 'bg-red-100 text-red-800',
          Moderate: 'bg-orange-100 text-orange-800',
          Limited: 'bg-yellow-100 text-yellow-800',
          Insufficient: 'bg-gray-100 text-gray-800',
        };
        return (
          <span
            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
              colors[strength]
            }`}
          >
            {strength}
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
      render: (value: any, item: Intervention) => {
        const rating = item.reliabilityRating;
        return (
          <div className="flex items-center">
            <div className="w-full bg-gray-200 rounded-full h-2.5">
              <div
                className="bg-indigo-600 h-2.5 rounded-full"
                style={{ width: `${rating * 20}%` }}
              ></div>
            </div>
            <span className="ml-2 text-sm text-gray-600">{rating}/5</span>
          </div>
        );
      },
    },
  ],
};

const filterOptions = [
  { label: 'All Conditions', value: '' },
  { label: 'Depression', value: 'depression' },
  { label: 'Anxiety', value: 'anxiety' },
  { label: 'PTSD', value: 'ptsd' },
  { label: 'OCD', value: 'ocd' },
  { label: 'ADHD', value: 'adhd' },
  { label: 'Bipolar Disorder', value: 'bipolar' },
  { label: 'Eating Disorders', value: 'eating_disorder' },
  { label: 'Sleep Disorders', value: 'sleep_disorder' },
  { label: 'Substance Use', value: 'substance_use' },
  { label: 'Personality Disorders', value: 'personality_disorder' },
  { label: 'Schizophrenia', value: 'schizophrenia' },
  { label: 'Autism Spectrum', value: 'autism' },
  { label: 'Stress', value: 'stress' },
  { label: 'Trauma', value: 'trauma' },
  { label: 'Mood Disorders', value: 'mood_disorder' },
];

const tabTitles = {
  lifestyle: 'Lifestyle Interventions',
  clinical: 'Clinical Interventions',
  risk_factor: 'Risk Factors',
};

const tabDescriptions = {
  lifestyle: 'Evidence-based lifestyle changes ranked by scientific support and effectiveness',
  clinical: 'Evidence-based clinical and therapeutic interventions ranked by scientific support and effectiveness',
  risk_factor: 'Understanding risk factors is important for prevention and early intervention. Remember that correlation does not imply causation, and many factors can be modified or mitigated.',
};

export default function EvidencePage() {
  const [activeTab, setActiveTab] = useState<TabType>('lifestyle');
  const [interventions, setInterventions] = useState<Intervention[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const data = await getInterventions(activeTab);
        setInterventions(data);
      } catch (err) {
        setError(`Failed to load ${tabTitles[activeTab].toLowerCase()}`);
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [activeTab]);

  const handleFilterChange = async (filter: string) => {
    setLoading(true);
    try {
      const data = filter
        ? await getInterventionsByCondition(activeTab, filter)
        : await getInterventions(activeTab);
      setInterventions(data);
    } catch (err) {
      setError(`Failed to filter ${tabTitles[activeTab].toLowerCase()}`);
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
          Evidence-Based Mental Health
        </h1>
        <p className="mt-2 text-lg text-gray-600">
          Comprehensive collection of evidence-based interventions, lifestyle factors, and risk factors
        </p>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200 mb-8">
        <nav className="-mb-px flex space-x-8">
          {Object.entries(tabTitles).map(([key, title]) => (
            <button
              key={key}
              onClick={() => setActiveTab(key as TabType)}
              className={`
                whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm
                ${
                  activeTab === key
                    ? 'border-indigo-500 text-indigo-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }
              `}
            >
              {title}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Description */}
      <div className="mb-8">
        <p className="text-lg text-gray-600">
          {tabDescriptions[activeTab]}
        </p>
        {activeTab === 'risk_factor' && (
          <div className="mt-4 p-4 bg-blue-50 rounded-lg">
            <p className="text-blue-800 text-sm">
              Note: This information is presented for educational purposes. 
              If you're concerned about your mental health, please consult with a healthcare professional.
            </p>
          </div>
        )}
      </div>

      {loading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
        </div>
      ) : (
        <CollapsibleTable
          data={interventions}
          columns={columns[activeTab]}
          title={tabTitles[activeTab]}
          filterOptions={filterOptions}
          onFilterChange={handleFilterChange}
          className="mb-8"
        />
      )}
    </div>
  );
} 