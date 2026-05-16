export interface Requirement {
  label: string;
  test: (value: string) => boolean;
}

interface InformRequirementsProps {
  value: string;
  requirements: Requirement[];
}

export function InformRequirements({ value, requirements }: InformRequirementsProps) {
  return (
    <ul className="space-y-1 text-sm">
      {requirements.map((req, i) => {
        const met = req.test(value);
        return (
          <li key={i} className={met ? "text-green-600" : "text-gray-400"}>
            <svg className="inline w-4 h-4 mr-1.5 -mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              {met ? (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              )}
            </svg>
            {req.label}
          </li>
        );
      })}
    </ul>
  );
}
