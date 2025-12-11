/**
 * Wave 1: Litigation Support Tools (15 tools)
 */
export const WAVE1_LITIGATION_TOOLS = [
  {
    name: 'Case Timeline Generator',
    slug: 'case-timeline-generator',
    description: 'Generate chronological timelines from case documents and facts',
    category: 'litigation-support',
    inputType: 'text',
    outputType: 'text',
    pricingTier: 'pro',
    promptTemplate: `Create a detailed chronological timeline from the following case facts and documents:

{{input}}

Format the timeline as:
- **Date**: Event description
- Include all parties involved in each event
- Note document references (Exhibit #, Bates #)
- Highlight key legal milestones (filing dates, deadlines, hearings)
- Identify gaps in the timeline that need investigation`,
    systemPrompt: 'You are an expert litigation paralegal specializing in case chronology and timeline creation. Be thorough and precise with dates.',
    maxTokens: 4000,
    temperature: 0.5,
    wave: 1,
  },
  {
    name: 'Deposition Summary Tool',
    slug: 'deposition-summary-tool',
    description: 'Summarize depositions with key testimony and page references',
    category: 'litigation-support',
    inputType: 'document',
    outputType: 'text',
    pricingTier: 'professional',
    promptTemplate: `Summarize this deposition transcript:

{{input}}

Provide a comprehensive summary including:
1. **Witness Background**: Name, role, relationship to case
2. **Key Admissions**: Statements favorable to our position (with page:line citations)
3. **Contradictions**: Inconsistencies with prior statements or documents
4. **Important Testimony**: Critical facts established (with page:line citations)
5. **Impeachment Opportunities**: Areas for cross-examination
6. **Follow-up Needed**: Topics requiring additional discovery`,
    systemPrompt: 'You are an expert litigation attorney skilled at deposition analysis. Always cite page:line numbers for key testimony.',
    maxTokens: 5000,
    temperature: 0.4,
    wave: 1,
  },
  {
    name: 'Expert Witness Finder',
    slug: 'expert-witness-finder',
    description: 'Identify and evaluate potential expert witnesses for your case',
    category: 'litigation-support',
    inputType: 'text',
    outputType: 'text',
    pricingTier: 'professional',
    promptTemplate: `Based on this case description, recommend expert witnesses:

{{input}}

For each expert type needed, provide:
1. **Specialty Required**: Specific expertise area
2. **Qualifications to Seek**: Education, experience, publications
3. **Key Testimony Areas**: What they would opine on
4. **Potential Daubert Challenges**: Weaknesses to address
5. **Sample Voir Dire Questions**: To establish qualifications
6. **Estimated Cost Range**: Typical fees for this expert type`,
    systemPrompt: 'You are a trial consultant specializing in expert witness selection and preparation.',
    maxTokens: 4000,
    temperature: 0.6,
    wave: 1,
  },
  {
    name: 'Settlement Calculator',
    slug: 'settlement-calculator',
    description: 'Analyze case factors to estimate settlement ranges',
    category: 'litigation-support',
    inputType: 'structured',
    outputType: 'json',
    pricingTier: 'professional',
    promptTemplate: `Analyze settlement value for this case:

{{input}}

Provide a structured analysis:
1. **Damages Breakdown**:
   - Economic damages (medical, lost wages, property)
   - Non-economic damages (pain/suffering, emotional distress)
   - Punitive damages potential
2. **Liability Assessment**: Percentage (0-100%) with reasoning
3. **Settlement Range**:
   - Low: Conservative estimate
   - Mid: Most likely outcome
   - High: Best case scenario
4. **Key Value Factors**: What increases/decreases value
5. **Negotiation Strategy**: Opening demand, walk-away point`,
    systemPrompt: 'You are a litigation valuation expert with extensive settlement experience.',
    maxTokens: 3000,
    temperature: 0.5,
    wave: 1,
  },
  {
    name: 'Discovery Request Generator',
    slug: 'discovery-request-generator',
    description: 'Generate comprehensive discovery requests tailored to your case',
    category: 'litigation-support',
    inputType: 'text',
    outputType: 'document',
    pricingTier: 'pro',
    promptTemplate: `Generate discovery requests for this case:

{{input}}

Create comprehensive discovery including:
1. **Interrogatories** (maximum 25):
   - Identify all witnesses
   - Establish facts and contentions
   - Discover documents and evidence
2. **Requests for Production**:
   - All relevant documents
   - Electronic communications
   - Physical evidence
3. **Requests for Admission**:
   - Authenticity of documents
   - Key facts
   - Legal contentions
4. **Definitions and Instructions**: Standard legal definitions`,
    systemPrompt: 'You are a discovery specialist. Draft thorough, specific, and strategically targeted discovery requests.',
    maxTokens: 6000,
    temperature: 0.5,
    wave: 1,
  },
  {
    name: 'Motion to Dismiss Drafter',
    slug: 'motion-to-dismiss-drafter',
    description: 'Draft motions to dismiss with legal arguments and citations',
    category: 'litigation-support',
    inputType: 'text',
    outputType: 'document',
    pricingTier: 'professional',
    promptTemplate: `Draft a Motion to Dismiss for:

{{input}}

Include:
1. **Caption and Introduction**
2. **Statement of Facts**
3. **Legal Standard**: Rule 12(b) standards
4. **Argument**:
   - Failure to state a claim
   - Lack of jurisdiction (if applicable)
   - Other grounds
5. **Conclusion and Prayer for Relief**
6. **Certificate of Service**`,
    systemPrompt: 'You are an appellate attorney skilled at motion practice. Cite relevant case law and rules.',
    maxTokens: 6000,
    temperature: 0.5,
    wave: 1,
  },
  {
    name: 'Summary Judgment Brief Writer',
    slug: 'summary-judgment-brief-writer',
    description: 'Draft summary judgment motions and briefs',
    category: 'litigation-support',
    inputType: 'text',
    outputType: 'document',
    pricingTier: 'professional',
    promptTemplate: `Draft a Motion for Summary Judgment:

{{input}}

Include:
1. **Statement of Undisputed Material Facts** (numbered)
2. **Legal Standard**: Summary judgment standards
3. **Argument**:
   - No genuine dispute of material fact
   - Entitlement to judgment as a matter of law
4. **Response to Anticipated Opposition**
5. **Conclusion**`,
    systemPrompt: 'You are a litigation partner experienced in dispositive motions.',
    maxTokens: 8000,
    temperature: 0.5,
    wave: 1,
  },
  {
    name: 'Jury Instruction Drafter',
    slug: 'jury-instruction-drafter',
    description: 'Draft proposed jury instructions for trial',
    category: 'litigation-support',
    inputType: 'text',
    outputType: 'document',
    pricingTier: 'professional',
    promptTemplate: `Draft jury instructions for:

{{input}}

Include:
1. **Preliminary Instructions**
2. **Substantive Law Instructions**:
   - Elements of claims/defenses
   - Burden of proof
   - Damages
3. **Closing Instructions**
4. **Verdict Form**
5. **Citations**: Pattern instructions and case law`,
    systemPrompt: 'You are a trial attorney experienced in jury trials.',
    maxTokens: 5000,
    temperature: 0.4,
    wave: 1,
  },
  {
    name: 'Trial Exhibit Organizer',
    slug: 'trial-exhibit-organizer',
    description: 'Organize and index trial exhibits with descriptions',
    category: 'litigation-support',
    inputType: 'text',
    outputType: 'text',
    pricingTier: 'pro',
    promptTemplate: `Organize these trial exhibits:

{{input}}

Create:
1. **Exhibit List**: Numbered with descriptions
2. **Authentication Notes**: Foundation requirements
3. **Witness Links**: Who will introduce each exhibit
4. **Objection Anticipation**: Likely objections and responses
5. **Trial Notebook Organization**: Suggested groupings`,
    systemPrompt: 'You are a trial preparation specialist.',
    maxTokens: 4000,
    temperature: 0.4,
    wave: 1,
  },
  {
    name: 'Witness Preparation Guide',
    slug: 'witness-preparation-guide',
    description: 'Create witness preparation outlines and practice questions',
    category: 'litigation-support',
    inputType: 'text',
    outputType: 'text',
    pricingTier: 'professional',
    promptTemplate: `Create a witness preparation guide for:

{{input}}

Include:
1. **Key Topics**: What witness will testify about
2. **Direct Examination Outline**: Questions and expected answers
3. **Cross-Examination Preparation**: Anticipated attacks
4. **Document Review List**: Exhibits witness should review
5. **Demeanor Coaching Points**: Presentation tips
6. **Practice Questions**: For mock examination`,
    systemPrompt: 'You are a trial consultant specializing in witness preparation.',
    maxTokens: 5000,
    temperature: 0.5,
    wave: 1,
  },
  {
    name: 'Opening Statement Generator',
    slug: 'opening-statement-generator',
    description: 'Draft compelling opening statements for trial',
    category: 'litigation-support',
    inputType: 'text',
    outputType: 'text',
    pricingTier: 'professional',
    promptTemplate: `Draft an opening statement for:

{{input}}

Structure:
1. **Theme**: Memorable case theme
2. **Story**: Narrative of what happened
3. **Key Evidence Preview**: What jury will see
4. **Witness Preview**: Who jury will hear from
5. **Conclusion**: What verdict to return and why`,
    systemPrompt: 'You are a trial attorney known for persuasive opening statements.',
    maxTokens: 4000,
    temperature: 0.6,
    wave: 1,
  },
  {
    name: 'Closing Argument Generator',
    slug: 'closing-argument-generator',
    description: 'Draft persuasive closing arguments for trial',
    category: 'litigation-support',
    inputType: 'text',
    outputType: 'text',
    pricingTier: 'professional',
    promptTemplate: `Draft a closing argument for:

{{input}}

Structure:
1. **Theme Reinforcement**
2. **Evidence Summary**: Key exhibits and testimony
3. **Legal Elements**: How evidence proves each element
4. **Credibility Arguments**: Why to believe our witnesses
5. **Damages Argument**: Why requested amount is appropriate
6. **Call to Action**: Specific verdict requested`,
    systemPrompt: 'You are a trial attorney known for persuasive closing arguments.',
    maxTokens: 5000,
    temperature: 0.6,
    wave: 1,
  },
  {
    name: 'Appeal Brief Analyzer',
    slug: 'appeal-brief-analyzer',
    description: 'Analyze appellate briefs and identify strengths/weaknesses',
    category: 'litigation-support',
    inputType: 'document',
    outputType: 'text',
    pricingTier: 'professional',
    promptTemplate: `Analyze this appellate brief:

{{input}}

Evaluate:
1. **Standard of Review**: Correctly stated?
2. **Preservation of Error**: Issues properly preserved?
3. **Argument Strength**: Persuasiveness of each argument
4. **Case Law Analysis**: Are citations on point?
5. **Weaknesses**: Gaps or vulnerabilities
6. **Response Strategy**: How to counter`,
    systemPrompt: 'You are an appellate specialist with extensive brief-writing experience.',
    maxTokens: 5000,
    temperature: 0.5,
    wave: 1,
  },
  {
    name: 'E-Discovery Search Term Generator',
    slug: 'ediscovery-search-terms',
    description: 'Generate comprehensive search terms for e-discovery',
    category: 'litigation-support',
    inputType: 'text',
    outputType: 'text',
    pricingTier: 'pro',
    promptTemplate: `Generate e-discovery search terms for:

{{input}}

Provide:
1. **Key Terms**: Names, dates, projects
2. **Boolean Searches**: Complex queries
3. **Proximity Searches**: Related term combinations
4. **Exclusion Terms**: To reduce false positives
5. **Custodian Recommendations**: Whose data to search
6. **Date Range Suggestions**: Relevant time periods`,
    systemPrompt: 'You are an e-discovery specialist experienced in search methodology.',
    maxTokens: 3000,
    temperature: 0.5,
    wave: 1,
  },
  {
    name: 'Privilege Log Generator',
    slug: 'privilege-log-generator',
    description: 'Generate privilege log entries for withheld documents',
    category: 'litigation-support',
    inputType: 'text',
    outputType: 'text',
    pricingTier: 'pro',
    promptTemplate: `Generate privilege log entries for:

{{input}}

For each document provide:
1. **Bates Number Range**
2. **Date**
3. **Author/Recipient**
4. **CC Recipients**
5. **Document Type**
6. **Privilege Claimed**: Attorney-client, work product, etc.
7. **Privilege Description**: Basis for claim`,
    systemPrompt: 'You are a discovery attorney experienced in privilege review.',
    maxTokens: 4000,
    temperature: 0.3,
    wave: 1,
  },
]
