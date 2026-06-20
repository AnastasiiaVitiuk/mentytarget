export type Modality = "Small Molecule" | "Antibody"
export type Resource = "GWAS" | "Transcriptomics" | "Literature"

export interface Target {
  symbol: string
  name: string
  score: number
  modality: Modality
  resource: Resource
}

export interface Paper {
  title: string
  journal: string
  year: number
  targets: string[]
}

export interface DiseaseResult {
  disease: string
  targets: Target[]
  papers: Paper[]
}

const depression: DiseaseResult = {
  disease: "Major depressive disorder",
  targets: [
    { symbol: "CACNA1C", name: "Calcium voltage-gated channel subunit alpha1 C", score: 0.94, modality: "Small Molecule", resource: "GWAS" },
    { symbol: "SLC6A4", name: "Serotonin transporter", score: 0.91, modality: "Small Molecule", resource: "Literature" },
    { symbol: "BDNF", name: "Brain-derived neurotrophic factor", score: 0.88, modality: "Antibody", resource: "Transcriptomics" },
    { symbol: "GRIN2B", name: "Glutamate ionotropic receptor NMDA type subunit 2B", score: 0.83, modality: "Small Molecule", resource: "GWAS" },
    { symbol: "FKBP5", name: "FKBP prolyl isomerase 5", score: 0.79, modality: "Small Molecule", resource: "Transcriptomics" },
    { symbol: "HTR2A", name: "5-hydroxytryptamine receptor 2A", score: 0.74, modality: "Small Molecule", resource: "Literature" },
    { symbol: "TNF", name: "Tumor necrosis factor", score: 0.68, modality: "Antibody", resource: "Transcriptomics" },
    { symbol: "CRHR1", name: "Corticotropin releasing hormone receptor 1", score: 0.61, modality: "Small Molecule", resource: "GWAS" },
  ],
  papers: [
    { title: "CACNA1C risk variants modulate cortical excitability in mood disorders", journal: "Nature Neuroscience", year: 2024, targets: ["CACNA1C"] },
    { title: "Serotonin transporter occupancy and antidepressant response: a meta-analysis", journal: "Molecular Psychiatry", year: 2023, targets: ["SLC6A4", "HTR2A"] },
    { title: "BDNF signaling as a convergent mechanism in treatment-resistant depression", journal: "Cell Reports Medicine", year: 2024, targets: ["BDNF"] },
    { title: "NMDA receptor modulation and rapid-acting antidepressants", journal: "Neuron", year: 2022, targets: ["GRIN2B"] },
    { title: "Inflammatory cytokine TNF-α as a stratification biomarker in MDD", journal: "Biological Psychiatry", year: 2023, targets: ["TNF"] },
  ],
}

const schizophrenia: DiseaseResult = {
  disease: "Schizophrenia",
  targets: [
    { symbol: "DRD2", name: "Dopamine receptor D2", score: 0.96, modality: "Small Molecule", resource: "Literature" },
    { symbol: "GRM3", name: "Glutamate metabotropic receptor 3", score: 0.9, modality: "Small Molecule", resource: "GWAS" },
    { symbol: "CACNA1C", name: "Calcium voltage-gated channel subunit alpha1 C", score: 0.87, modality: "Small Molecule", resource: "GWAS" },
    { symbol: "C4A", name: "Complement component 4A", score: 0.84, modality: "Antibody", resource: "Transcriptomics" },
    { symbol: "GRIN2A", name: "Glutamate ionotropic receptor NMDA type subunit 2A", score: 0.8, modality: "Small Molecule", resource: "GWAS" },
    { symbol: "TCF4", name: "Transcription factor 4", score: 0.72, modality: "Small Molecule", resource: "Transcriptomics" },
    { symbol: "CHRNA7", name: "Cholinergic receptor nicotinic alpha 7 subunit", score: 0.66, modality: "Small Molecule", resource: "Literature" },
    { symbol: "IL6", name: "Interleukin 6", score: 0.59, modality: "Antibody", resource: "Transcriptomics" },
  ],
  papers: [
    { title: "Dopamine D2 receptor occupancy thresholds across antipsychotic classes", journal: "The Lancet Psychiatry", year: 2023, targets: ["DRD2"] },
    { title: "Complement C4A copy number and synaptic pruning in schizophrenia", journal: "Nature", year: 2022, targets: ["C4A"] },
    { title: "Metabotropic glutamate receptor 3 as a procognitive target", journal: "Molecular Psychiatry", year: 2024, targets: ["GRM3", "GRIN2A"] },
    { title: "TCF4 regulatory networks in neurodevelopmental risk", journal: "Cell", year: 2023, targets: ["TCF4"] },
    { title: "Neuroinflammation and IL-6 signaling in first-episode psychosis", journal: "Biological Psychiatry", year: 2024, targets: ["IL6"] },
  ],
}

const bipolar: DiseaseResult = {
  disease: "Bipolar disorder",
  targets: [
    { symbol: "CACNA1C", name: "Calcium voltage-gated channel subunit alpha1 C", score: 0.93, modality: "Small Molecule", resource: "GWAS" },
    { symbol: "ANK3", name: "Ankyrin 3", score: 0.89, modality: "Small Molecule", resource: "GWAS" },
    { symbol: "GSK3B", name: "Glycogen synthase kinase 3 beta", score: 0.85, modality: "Small Molecule", resource: "Literature" },
    { symbol: "TRANK1", name: "Tetratricopeptide repeat and ankyrin repeat 1", score: 0.78, modality: "Small Molecule", resource: "Transcriptomics" },
    { symbol: "ODZ4", name: "Teneurin transmembrane protein 4", score: 0.71, modality: "Antibody", resource: "GWAS" },
    { symbol: "NCAN", name: "Neurocan", score: 0.64, modality: "Antibody", resource: "Transcriptomics" },
  ],
  papers: [
    { title: "Lithium response and GSK3β inhibition: mechanistic insights", journal: "Molecular Psychiatry", year: 2023, targets: ["GSK3B"] },
    { title: "ANK3 and CACNA1C convergence on neuronal excitability", journal: "Nature Neuroscience", year: 2024, targets: ["ANK3", "CACNA1C"] },
    { title: "Genome-wide association of bipolar disorder identifies TRANK1", journal: "Nature Genetics", year: 2022, targets: ["TRANK1"] },
  ],
}

const autism: DiseaseResult = {
  disease: "Autism spectrum disorder",
  targets: [
    { symbol: "SHANK3", name: "SH3 and multiple ankyrin repeat domains 3", score: 0.95, modality: "Small Molecule", resource: "GWAS" },
    { symbol: "MECP2", name: "Methyl-CpG binding protein 2", score: 0.9, modality: "Small Molecule", resource: "Literature" },
    { symbol: "SCN2A", name: "Sodium voltage-gated channel alpha subunit 2", score: 0.86, modality: "Small Molecule", resource: "GWAS" },
    { symbol: "CHD8", name: "Chromodomain helicase DNA binding protein 8", score: 0.82, modality: "Small Molecule", resource: "Transcriptomics" },
    { symbol: "FMR1", name: "Fragile X messenger ribonucleoprotein 1", score: 0.77, modality: "Antibody", resource: "Literature" },
    { symbol: "GRIN2B", name: "Glutamate ionotropic receptor NMDA type subunit 2B", score: 0.7, modality: "Small Molecule", resource: "GWAS" },
  ],
  papers: [
    { title: "SHANK3 haploinsufficiency and synaptic scaffolding deficits", journal: "Neuron", year: 2023, targets: ["SHANK3"] },
    { title: "CHD8 regulates neurodevelopmental gene expression programs", journal: "Cell", year: 2022, targets: ["CHD8"] },
    { title: "SCN2A channelopathies across the autism-epilepsy spectrum", journal: "Nature Neuroscience", year: 2024, targets: ["SCN2A", "GRIN2B"] },
  ],
}

const DISEASES: DiseaseResult[] = [depression, schizophrenia, bipolar, autism]

export const DEFAULT_RESULT = depression

export function searchDisease(query: string): DiseaseResult {
  const q = query.trim().toLowerCase()
  if (!q) return DEFAULT_RESULT
  const match = DISEASES.find(
    (d) =>
      d.disease.toLowerCase().includes(q) ||
      q.includes(d.disease.toLowerCase().split(" ")[0]),
  )
  return match ?? DEFAULT_RESULT
}
