import { CVProfile, CVCertification, CVEducation, CVSkillCategory } from '../types';

export const RWEMERA_CERTIFICATIONS: CVCertification[] = [
  {
    id: 'cert-poti-unmas-mine-action',
    name: 'Mine Action and Explosive Hazard Management: Humanitarian Impact, Technical Aspects, and Global Initiatives',
    issuer: 'Peace Operations Training Institute (POTI) & United Nations Mine Action Service (UNMAS)',
    issueDate: '2025-03-08',
    credentialId: 'Serial: 959236942',
    credentialUrl: 'https://www.peaceopstraining.org/verify/',
    category: 'Peace Operations & Humanitarian Action',
    score: 'Certified',
    notes: 'Signed by Mr. Richard Boulter (UNMAS Chief of Strategic Planning & Operations Support) & Ramona Taheri (Executive Director, POTI).'
  },
  {
    id: 'cert-csm-high-performance',
    name: 'CSM Certificate of High Performance (Essentials of High Performance)',
    issuer: 'SeeMore Impact Labs (ACE Recommended for College Credit)',
    issueDate: '2025-01-06',
    credentialId: 'EWHE-LVRR-MZYW-VGDG',
    credentialUrl: 'https://www.smilabs.org/verify',
    category: 'High Performance & Cognitive Agility',
    score: '100% Overall Mastery',
    notes: 'Mastery of 34 core skills in complex math, literacy, multi-step problem solving, metacognition, and persistence. Signed by Dr. David Goldberg, CEO.'
  },
  {
    id: 'cert-poti-unesco-cultural-property',
    name: 'Protection of Cultural Property: Online Course for the Military, Police, and Law Enforcement',
    issuer: 'Peace Operations Training Institute (POTI) & UNESCO',
    issueDate: '2024-08-17',
    credentialId: 'Serial: 198894920',
    credentialUrl: 'https://www.peaceopstraining.org/verify/',
    category: 'Peace Operations & Humanitarian Action',
    score: 'Certified',
    notes: 'Signed by Ernesto Ottone Ramírez (UNESCO Assistant Director-General for Culture) & Ramona Taheri (POTI).'
  },
  {
    id: 'cert-poti-security-sector-reform',
    name: 'Security Sector Reform & Governance: Leadership Engagement',
    issuer: 'Peace Operations Training Institute (POTI)',
    issueDate: '2024-07-24',
    credentialId: 'Serial: 486498434',
    credentialUrl: 'https://www.peaceopstraining.org/verify/',
    category: 'Peace Operations & Humanitarian Action',
    score: 'Certified',
    notes: 'Leadership engagement, rule of law, and institutional governance in peace operations.'
  },
  {
    id: 'cert-gallup-cliftonstrengths',
    name: 'Gallup CliftonStrengths: Signature Talent Themes (Top 5)',
    issuer: 'Gallup, Inc.',
    issueDate: '2024-07-18',
    credentialId: 'Arranger | Connectedness | Learner | Empathy | Individualization',
    category: 'High Performance & Strengths',
    score: 'Top 5 Signature Themes',
    notes: '1. Arranger (Flexible resource coordination) • 2. Connectedness (Faith in collective links) • 3. Learner (Relentless skill acquisition) • 4. Empathy (Deep human-centric perspective) • 5. Individualization (Unlocking distinct human qualities).'
  },
  {
    id: 'cert-efset-c2-proficient',
    name: 'EF SET English Certificate — C2 Proficient (CEFR)',
    issuer: 'EF Standard English Test (EF SET)',
    issueDate: '2024-06-11',
    credentialId: 'C8VasC',
    credentialUrl: 'https://cert.efset.org/C8VasC',
    category: 'Language & Communication',
    score: '71/100 (C2 Proficient) | Writing: 100/100 (C2)',
    notes: 'Exceptional language mastery: Writing 100/100 (C2 Proficient), Reading 75/100 (C2 Proficient), Speaking 58/100 (B2), Listening 51/100 (B2).'
  },
  {
    id: 'cert-atingi-computing-skills',
    name: 'Computing Skills for Business',
    issuer: 'atingi & Deutsche Gesellschaft für Internationale Zusammenarbeit (GIZ)',
    issueDate: '2024-09-24',
    credentialId: '6082676961RA',
    category: 'Business & Digital Productivity',
    score: 'Certified',
    notes: 'Funded by the German Federal Ministry for Economic Cooperation and Development (BMZ).'
  },
  {
    id: 'cert-ingazi-financial-risks',
    name: 'Financial Risks and Goals (Course 04)',
    issuer: 'Ingazi Passport to Earning Rwanda (UNICEF / GenU)',
    issueDate: '2024-09-10',
    credentialId: 'Course 04 - 100%',
    category: 'Business & Digital Productivity',
    score: '100%',
    notes: 'Budgeting, financial risk evaluation, and long-term economic planning.'
  },
  {
    id: 'cert-ingazi-developing-to-sell',
    name: 'Developing Something To Sell (Course 05)',
    issuer: 'Ingazi Passport to Earning Rwanda (UNICEF / GenU)',
    issueDate: '2024-09-11',
    credentialId: 'Course 05 - 75%',
    category: 'Business & Digital Productivity',
    score: '75%',
    notes: 'Product ideation, market validation, and sales execution strategies.'
  },
  {
    id: 'cert-ingazi-digital-productivity',
    name: 'Digital Productivity',
    issuer: 'Ingazi Passport to Earning Rwanda (UNICEF / GenU)',
    issueDate: '2024-09-05',
    credentialId: 'Ingazi-DP-2024',
    category: 'Business & Digital Productivity',
    score: 'Completed',
    notes: 'Modern workplace digital workflows, tooling, and communication.'
  },
  {
    id: 'cert-ingazi-planning-unexpected',
    name: 'Planning For The Unexpected (Course 13)',
    issuer: 'Ingazi Passport to Earning Rwanda (UNICEF / GenU)',
    issueDate: '2024-09-24',
    credentialId: 'Course 13',
    category: 'Business & Digital Productivity',
    score: 'Completed',
    notes: 'Contingency planning, risk mitigation, and operational resilience.'
  },
  {
    id: 'cert-kaya-safeguarding',
    name: 'Safeguarding Essentials',
    issuer: 'Humanitarian Leadership Academy (Kaya)',
    issueDate: '2022-08-25',
    credentialId: 'HLA-Kaya-SE',
    category: 'Peace Operations & Humanitarian Action',
    score: 'Certified',
    notes: 'Protection of vulnerable populations, prevention of sexual exploitation, and ethical conduct in humanitarian interventions.'
  },
  {
    id: 'cert-idebate-9th-speaker',
    name: 'Certificate of Merit — 9th Speaker Award (Online Debate Tournament)',
    issuer: 'iDebate Rwanda',
    issueDate: '2021-06-13',
    credentialId: 'Awarded by Jean Michel Habineza, Managing Director',
    category: 'Debate & Public Advocacy',
    score: '9th Speaker Nationwide',
    notes: 'Awarded in recognition of outstanding individual speaker performance in competitive parliamentary debate.'
  },
  {
    id: 'cert-debatedrills-elements-persuasion',
    name: 'Elements of Persuasion',
    issuer: 'DebateDrills',
    issueDate: '2023-04-22',
    credentialId: '8doxmszasw',
    category: 'Debate & Public Advocacy',
    score: 'Completed',
    notes: 'Rhetorical structure, ethical persuasion, argumentation frameworks, and audience analysis.'
  },
  {
    id: 'cert-debatedrills-public-health',
    name: '(LD) Nationals 2021 Topic Analysis — Public Health',
    issuer: 'DebateDrills',
    issueDate: '2023-04-22',
    credentialId: '0a9iveiaqo',
    category: 'Debate & Public Advocacy',
    score: 'Completed',
    notes: 'Lincoln-Douglas debate topic research, epidemiological ethics, and public healthcare resource allocation.'
  },
  {
    id: 'cert-debatedrills-laws',
    name: '(LD) Evidence Starter Pack — Lethal Autonomous Weapons (LAWs)',
    issuer: 'DebateDrills',
    issueDate: '2023-04-22',
    credentialId: 'rmbmxmjxb9',
    category: 'Debate & Public Advocacy',
    score: 'Completed',
    notes: 'International humanitarian law, autonomous robotics ethics, and arms control analysis.'
  },
  {
    id: 'cert-debatedrills-tournaments',
    name: 'How Tournaments Work',
    issuer: 'DebateDrills',
    issueDate: '2023-04-22',
    credentialId: '3rftqqxqko',
    category: 'Debate & Public Advocacy',
    score: 'Completed',
    notes: 'Tournament organization, bracket management, speaker tabulations, and adjudication standards.'
  }
];

export const RWEMERA_EDUCATION: CVEducation[] = [
  {
    id: 'edu-ur-social-work',
    institution: 'University of Rwanda (UR) — College of Arts and Social Sciences (CASS)',
    degree: 'Bachelor of Social Sciences (Honours)',
    field: 'Social Work (BH8SOW)',
    startYear: '2023',
    endYear: '2027 (In Progress)',
    honors: 'Student No: 223020280 | Huye Campus (Full-Time)'
  },
  {
    id: 'edu-rusumo-high-school',
    institution: 'Rusumo High School (NESA National Examination)',
    degree: 'Advanced Level Certificate of Secondary Education (A2)',
    field: 'Literature, Economics and Geography (MEG)',
    startYear: '2019',
    endYear: '2022',
    honors: 'Weighted Aggregate: 60/60 (Straight A\'s: Literature A, Economics A, Entrepreneurship A, Geography A)'
  }
];

export const RWEMERA_SKILLS: CVSkillCategory[] = [
  {
    category: 'Humanitarian & Peace Operations',
    skills: [
      'Mine Action & Explosive Hazard Management (UNMAS)',
      'Protection of Cultural Property (UNESCO)',
      'Security Sector Reform & Institutional Governance',
      'Safeguarding Essentials (Humanitarian Leadership Academy)',
      'Public Health Vulnerability Assessment',
      'Community Organizing & Social Action'
    ]
  },
  {
    category: 'High Performance & Cognitive Strengths (Gallup & CSM)',
    skills: [
      'Arranger (Resource & Workflow Orchestration)',
      'Connectedness (Cross-System & Interpersonal Linkages)',
      'Learner (Rapid Knowledge & Technical Mastery)',
      'Empathy (Human-Centered Insight & Listening)',
      'Individualization (Team Dynamics & Role Alignment)',
      'CSM Mastery (Complex Problem Solving & Metacognition)'
    ]
  },
  {
    category: 'Advocacy, Debate & Communication',
    skills: [
      'Competitive Debate & Public Speaking (iDebate 9th Speaker)',
      'Rhetorical Structuring & Persuasion',
      'Policy Analysis & Evidence Synthesis',
      'C2 Proficient English (EF SET 100/100 Writing)',
      'Dispute Mediation & Community Dialogue'
    ]
  },
  {
    category: 'Digital, Business & Economic Strategy',
    skills: [
      'Computing Skills for Business (atingi / GIZ)',
      'Digital Productivity & Modern Workflows',
      'Financial Risk Management & Goal Planning (100%)',
      'Venture Design & Market Execution (Ingazi)',
      'Data Interpretation & Analytical Reporting'
    ]
  }
];

export const RWEMERA_MASTER_PROFILE: CVProfile = {
  userId: '',
  fullName: 'RWEMERA Ally Hamis',
  title: 'Social Work & Humanitarian Operations Specialist | High Performance Advocate',
  email: 'rwemera30@gmail.com',
  phone: '+250 788 807 155',
  location: 'Kigali, Rwanda (Kacyiru, Gasabo / Ngoma & Kirehe)',
  website: 'https://cert.efset.org/C8VasC',
  linkedin: 'https://linkedin.com/in/rwemera-ally-hamis',
  github: 'https://github.com/rwemera30',
  summary: 'Multidisciplinary Social Sciences scholar at the University of Rwanda with specialized certifications in United Nations peace operations (Mine Action with UNMAS, Cultural Property Protection with UNESCO, and Security Sector Reform with POTI) and humanitarian safeguarding (Humanitarian Leadership Academy). Demonstrates exceptional cognitive problem-solving (100% CSM High Performance mastery), certified CEFR C2 English fluency (100/100 Writing score), and nationally recognized competitive debate and advocacy acumen. Gallup CliftonStrengths: Arranger, Connectedness, Learner, Empathy, and Individualization.',
  experiences: [
    {
      id: 'exp-rwemera-1',
      role: 'Student Researcher & Community Social Work Scholar',
      company: 'University of Rwanda — College of Arts and Social Sciences (CASS)',
      location: 'Huye / Kigali, Rwanda',
      startDate: '2023',
      endDate: 'Present',
      current: true,
      description: 'Engaging in rigorous academic research and practical fieldwork in social work methodologies, community resilience, safeguarding vulnerable populations, and public health systems.',
      achievements: [
        'Applied evidence-based social work frameworks to assess social vulnerability and community cohesion.',
        'Completed specialized United Nations peace operations training across Mine Action (UNMAS) and Cultural Property Protection (UNESCO).',
        'Demonstrated top-tier learning agility by passing SeeMore Impact Labs CSM High Performance with a 100% mastery score.'
      ]
    },
    {
      id: 'exp-rwemera-2',
      role: 'Competitive Debater & Youth Public Policy Advocate',
      company: 'iDebate Rwanda & DebateDrills',
      location: 'Kigali, Rwanda',
      startDate: '2021',
      endDate: 'Present',
      current: true,
      description: 'Competed at national and online debate tournaments, researching critical global policies spanning public health, lethal autonomous weapons, and socio-economic equity.',
      achievements: [
        'Awarded 9th Speaker overall in the National Online Debate Tournament by iDebate Rwanda.',
        'Completed comprehensive DebateDrills certifications across Elements of Persuasion, Public Health Topic Analysis, and Tournament Governance.',
        'Mentored peers in public speaking, critical thinking, argumentation, and evidence verification.'
      ]
    },
    {
      id: 'exp-rwemera-3',
      role: 'Secondary Scholar & Peer Academic Leader',
      company: 'Rusumo High School',
      location: 'Kirehe, Eastern Province, Rwanda',
      startDate: '2019',
      endDate: '2022',
      current: false,
      description: 'Focused on Literature, Economics, and Geography (MEG) in Rwanda National Examinations.',
      achievements: [
        'Achieved the maximum weighted aggregate score of 60/60 in Rwanda National Examinations (NESA).',
        'Earned straight Grade A distinctions across Literature in English, Economics, Entrepreneurship, and Geography.',
        'Represented the school in inter-academic debates and community student initiatives.'
      ]
    }
  ],
  education: RWEMERA_EDUCATION,
  certifications: RWEMERA_CERTIFICATIONS,
  skillCategories: RWEMERA_SKILLS,
  projects: [
    {
      id: 'proj-rwemera-humanitarian',
      title: 'Humanitarian Impact & Explosive Hazard Safety Initiative',
      role: 'Research & Operations Lead',
      description: 'Research framework analyzing post-conflict rehabilitation, mine action standards, and community risk education in alignment with UNMAS and international peace guidelines.',
      techStack: ['Mine Action (UNMAS)', 'Peace Operations', 'Public Health', 'Risk Analysis']
    },
    {
      id: 'proj-rwemera-debate',
      title: 'Youth Persuasion & Civic Dialogue Forum',
      role: 'Founding Debater & Moderator',
      description: 'Youth advocacy platform applying structured debate to dissect complex public health issues, ethical considerations of autonomous technologies, and community economic resilience.',
      techStack: ['Policy Analysis', 'Parliamentary Debate', 'Public Health', 'Ethics']
    },
    {
      id: 'proj-rwemera-os',
      title: 'Ally Hamis Autonomous Personal OS & Family Heritage Archive',
      role: 'Architect & Custodian',
      description: 'Personal digital system uniting task management, financial runway tracking, ancestral generational lineage tracing from Great-Grandpa downward, and verified credentials archive.',
      techStack: ['React', 'TypeScript', 'Firebase', 'Gemini AI', 'Data Sovereignty']
    }
  ]
};

export const RWEMERA_CIVIL_RECORDS = [
  {
    title: 'National Identity Card (Indangamuntu)',
    idNumber: '1 2002 8 0172601 1 53',
    placeOfIssue: 'Kirehe / Nyarubuye',
    dateOfBirth: '01/01/2002',
    issuer: 'Republic of Rwanda'
  },
  {
    title: 'Birth Certificate (Civil Registrar)',
    documentNo: 'B240207194534CGUT',
    father: 'Rwemera Iddi',
    mother: 'Murebwayire Aisha',
    placeOfBirth: 'Ngoma, Rwanda',
    issuedDate: '07/02/2024',
    issuedAt: 'Kacyiru, Gasabo'
  },
  {
    title: 'Criminal Record Certificate (Icyangombwa cy\'ubutabera)',
    decisionNo: 'DCJ/ECJ/070680/2023',
    status: 'Clean Record (No criminal convictions)',
    issuer: 'National Public Prosecution Authority (NPPA)'
  },
  {
    title: 'Bachelorhood Certificate (Icyemezo cy\'uko uri ingaragu)',
    documentNo: 'B230210105018B6IS',
    status: 'Single (Ingaragu)',
    issuedAt: 'Kacyiru, Gasabo'
  },
  {
    title: 'Equivalence Certificate — Lubibi Ismael Yusuf',
    documentNo: 'B231121101804VTFE',
    grade: 'Aggregate 11 (Math 1, Science 2, English 3, Social Studies 3)',
    issuer: 'NESA (National Examination and School Inspection Authority)'
  }
];
