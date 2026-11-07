import type { PublicSource } from './types';

/**
 * Public sources reviewed on 2026-11-07. Extracts are deliberately short and
 * support only the narrow statements recorded in the evidence register.
 */
export const PUBLIC_SOURCES: PublicSource[] = [
  {
    id: 'AIRBUS-MMS-01',
    title: 'Material, maintenance and global upgrades',
    publisher: 'Airbus',
    url: 'https://www.airbus.com/en/products-services/defence/military-aircraft/military-aircraft-services/material-maintenance',
    publicationDate: null,
    accessedDate: '2026-11-07',
    locator: '“Maximise fleet availability”, lines 21–27 in the reviewed public page',
    extract: 'Airbus offers support services for material availability, repairs and exchange items.',
    sourceType: 'publicWebPage',
    reviewState: 'reviewed',
    limitations: [
      'The page describes a service offering; it does not quantify a repair-versus-replacement outcome for a specific component.',
      'No cost, lead-time, availability or environmental factor from this source is used as a laboratory input.',
    ],
  },
  {
    id: 'AIRBUS-CIRC-01',
    title: 'Resources and circularity',
    publisher: 'Airbus',
    url: 'https://www.airbus.com/en/sustainability/environment/resources-and-circularity',
    publicationDate: null,
    accessedDate: '2026-11-07',
    locator: '“Smarter, longer and again” and “Longer”, lines 28–52 in the reviewed public page',
    extract: 'Airbus describes repair as one approach used to extend product lifespan.',
    sourceType: 'publicWebPage',
    reviewState: 'reviewed',
    limitations: [
      'This is a general circularity statement, not evidence that the fictional repair avoids manufacture, waste or emissions.',
      'It provides no component-specific lifecycle inventory or approved life-extension value.',
    ],
  },
  {
    id: 'AIRBUS-AR25-01',
    title: 'Airbus SE Report of the Board of Directors FY 2025',
    publisher: 'Airbus',
    url: 'https://www.airbus.com/sites/g/files/jlcbta136/files/2026-02/airbus_se_report_of_the_board_of_directors_fy_2025_1.pdf',
    publicationDate: '2026-02',
    accessedDate: '2026-11-07',
    locator: 'Section 6.2.5, p. 172, “Repairability, life extension”',
    extract: 'Products are designed to be maintained in operations and repaired when damaged.',
    sourceType: 'publicReport',
    reviewState: 'reviewed',
    limitations: [
      'The disclosure is company-level and not a validation of the laboratory case or any military-aircraft programme result.',
      'Repairability does not establish repair eligibility, environmental superiority or resilience improvement in a particular decision.',
    ],
  },
  {
    id: 'EASA-P145-01',
    title: 'Part-145 frequently asked questions',
    publisher: 'EASA',
    url: 'https://www.easa.europa.eu/en/the-agency/faqs/part-145',
    publicationDate: null,
    accessedDate: '2026-11-07',
    locator: 'Components / Class C and component overhaul guidance',
    extract: 'Component maintenance release under a Class C rating is performed on an EASA Form 1.',
    sourceType: 'regulatoryGuidance',
    reviewState: 'reviewed',
    limitations: [
      'Civil EASA continuing-airworthiness requirements may not map directly to a military programme or national military airworthiness regime.',
      'The source establishes control requirements, not the eligibility of the fictional component for repair.',
    ],
  },
];

export function sourceById(id: string) {
  return PUBLIC_SOURCES.find((source) => source.id === id);
}

