

export enum Role {
  QA = 'QA/IQA',
  SECTION = 'SECTION/AUDITEE',
  DQMR = 'DQMR'
}

export const DEPARTMENTS = [
  "Admitting Section",
  "Ambulatory Care Medicine Complex",
  "Cardiovascular Diagnostics",
  "Cashier Management",
  "Claims",
  "Emergency Room Complex",
  "Food and Nutrition Management",
  "General Services Section",
  "Health Records and Documents Management",
  "Housekeeping Laundry and Linen",
  "Industrial Clinic",
  "Information Technology",
  "Laboratory",
  "Medical Social Service",
  "Nursing Division",
  "Pathology",
  "Pharmacy",
  "Physical and Occupational Therapy",
  "Radiology",
  "Requisition Section",
  "Supply Management Section",
  "Surgical Care Complex"
];

export const NURSING_UNITS = [
  "OBGyne Ward",
  "NICU",
  "PICU",
  "Pedia Ward",
  "Pedia ICU",
  "Cohort",
  "Surgery Ward",
  "6th Floor Ward",
  "7th Floor",
  "Dialysis Unit",
  "Chemotherapy Unit",
  "Medicine Ward",
  "ICU",
  "Ambulatory Care Medicine Complex",
  "Emergency Room Complex",
  "Surgical Care Complex",
  "LRDR",
  "CSR"
];

export const CLINICAL_DEPARTMENTS = [
  "Department of Anaesthesiology",
  "Department of Emergency, Pre-hospital and Disaster Medicine",
  "Department of Family and Community Medicine",
  "Department of Internal Medicine",
  "Department of Obstetrics and Gynecology",
  "Department of Otorhinolaryngology – Head and Neck Surgery",
  "Department of Ophthalmology",
  "Department of Pathology and Laboratories",
  "Department of Pediatrics",
  "Department of Radiology",
  "Department of Physical and Rehabilitation Medicine",
  "Department of Surgery"
];

export const QA_PERSONNEL = [
  "Main QA Account",
  "Ana Concepcion Biligan",
  "Bernadette Babanto",
  "Catherine Vibal",
  "Charisse Baga",
  "Gemma Alli",
  "Joanna Christina Santos",
  "Marieta Avila",
  "Max Angelo G. Terrenal",
  "Michelle Loraine Rimando",
  "Millicent Lumabao",
  "Richard Son Solito",
  "Rochelle Del Rosario",
  "Ruth Sagales",
  "Sharalyn Dasigan",
  "Teodorico Frigillana"
];

export const ISO_CLAUSES = [
  { 
    code: "4.1", 
    title: "Understanding the organization and its context",
    content: "The organization shall determine external and internal issues that are relevant to its purpose and its strategic direction and that affect its ability to achieve the intended result(s) of its quality management system. The organization shall monitor and review information about these external and internal issues."
  },
  { 
    code: "4.2", 
    title: "Understanding the needs and expectations of interested parties",
    content: "Due to their effect or potential effect on the organization’s ability to consistently provide products and services that meet customer and applicable statutory and regulatory requirements, the organization shall determine: a) the interested parties that are relevant to the quality management system; b) the requirements of these interested parties that are relevant to the quality management system. The organization shall monitor and review information about these interested parties and their relevant requirements."
  },
  { 
    code: "4.3", 
    title: "Determining the scope of the quality management system",
    content: "The organization shall determine the boundaries and applicability of the quality management system to establish its scope. When determining this scope, the organization shall consider: a) the external and internal issues referred to in 4.1; b) the requirements of relevant interested parties referred to in 4.2; c) the products and services of the organization. The organization shall apply all the requirements of this International Standard if they are applicable within the determined scope of its quality management system. The scope of the organization’s quality management system shall be available and be maintained as documented information."
  },
  { 
    code: "4.4.1", 
    title: "Quality management system and its processes",
    content: "The organization shall establish, implement, maintain and continually improve a quality management system, including the processes needed and their interactions, in accordance with the requirements of this International Standard. The organization shall determine the processes needed for the quality management system and their application throughout the organization, and shall: a) determine the inputs required and the outputs expected from these processes; b) determine the sequence and interaction of these processes; c) determine and apply the criteria and methods needed to ensure the effective operation and control of these processes; d) determine the resources needed for these processes and ensure their availability; e) assign the responsibilities and authorities for these processes; f) address the risks and opportunities as determined in accordance with the requirements of 6.1; g) evaluate these processes and implement any changes needed to ensure that these processes achieve their intended results; h) improve the processes and the quality management system."
  },
  { 
    code: "4.4.2", 
    title: "Quality management system processes (Documented Info)",
    content: "To the extent necessary, the organization shall: a) maintain documented information to support the operation of its processes; b) retain documented information to have confidence that the processes are being carried out as planned."
  },
  { 
    code: "5.1.1", 
    title: "Leadership and commitment - General",
    content: "Top management shall demonstrate leadership and commitment with respect to the quality management system by: a) taking accountability for the effectiveness of the quality management system; b) ensuring that the quality policy and quality objectives are established for the quality management system and are compatible with the context and strategic direction of the organization; c) ensuring the integration of the quality management system requirements into the organization’s business processes; d) promoting the use of the process approach and risk-based thinking; e) ensuring that the resources needed for the quality management system are available; f) communicating the importance of effective quality management and of conforming to the quality management system requirements; g) ensuring that the quality management system achieves its intended results; h) engaging, directing and supporting persons to contribute to the effectiveness of the quality management system; i) promoting improvement; j) supporting other relevant management roles to demonstrate their leadership as it applies to their areas of responsibility."
  },
  { 
    code: "5.1.2", 
    title: "Customer focus",
    content: "Top management shall demonstrate leadership and commitment with respect to customer focus by ensuring that: a) customer and applicable statutory and regulatory requirements are determined, understood and consistently met; b) the risks and opportunities that can affect conformity of products and services and the ability to enhance customer satisfaction are determined and addressed; c) the focus on enhancing customer satisfaction is maintained."
  },
  { 
    code: "5.2.1", 
    title: "Establishing the quality policy",
    content: "Top management shall establish, implement and maintain a quality policy that: a) is appropriate to the purpose and context of the organization and supports its strategic direction; b) provides a framework for setting quality objectives; c) includes a commitment to satisfy applicable requirements; d) includes a commitment to continual improvement of the quality management system."
  },
  { 
    code: "5.2.2", 
    title: "Communicating the quality policy",
    content: "The quality policy shall: a) be available and be maintained as documented information; b) be communicated, understood and applied within the organization; c) be available to relevant interested parties, as appropriate."
  },
  { 
    code: "5.3", 
    title: "Organizational roles, responsibilities and authorities",
    content: "Top management shall ensure that the responsibilities and authorities for relevant roles are assigned, communicated and understood within the organization. Top management shall assign the responsibility and authority for: a) ensuring that the quality management system conforms to the requirements of this International Standard; b) ensuring that the processes are delivering their intended outputs; c) reporting on the performance of the quality management system and on opportunities for improvement (see 10.1), in particular to top management; d) ensuring the promotion of customer focus throughout the organization; e) ensuring that the integrity of the quality management system is maintained when changes to the quality management system are planned and implemented."
  },
  { 
    code: "6.1.1", 
    title: "Actions to address risks and opportunities",
    content: "When planning for the quality management system, the organization shall consider the issues referred to in 4.1 and the requirements referred to in 4.2 and determine the risks and opportunities that need to be addressed to: a) give assurance that the quality management system can achieve its intended result(s); b) enhance desirable effects; c) prevent, or reduce, undesired effects; d) achieve improvement."
  },
  { 
    code: "6.1.2", 
    title: "Planning actions for risks and opportunities",
    content: "The organization shall plan: a) actions to address these risks and opportunities; b) how to: 1. integrate and implement the actions into its quality management system processes (see 4.4); 2. evaluate the effectiveness of these actions. Actions taken to address risks and opportunities shall be proportionate to the potential impact on the conformity of products and services."
  },
  { 
    code: "6.2.1", 
    title: "Quality objectives",
    content: "The organization shall establish quality objectives at relevant functions, levels and processes needed for the quality management system. The quality objectives shall: a) be consistent with the quality policy; b) be measurable; c) take into account applicable requirements; d) be relevant to conformity of products and services and to enhancement of customer satisfaction; e) be monitored; f) be communicated; g) be updated as appropriate. The organization shall maintain documented information on the quality objectives."
  },
  { 
    code: "6.2.2", 
    title: "Planning to achieve quality objectives",
    content: "When planning how to achieve its quality objectives, the organization shall determine: a) what will be done; b) what resources will be required; c) who will be responsible; d) when it will be completed; e) how the results will be evaluated."
  },
  { 
    code: "6.3", 
    title: "Planning of changes",
    content: "When the organization determines the need for changes to the quality management system, the changes shall be carried out in a planned manner (see 4.4). The organization shall consider: a) the purpose of the changes and their potential consequences; b) the integrity of the quality management system; c) the availability of resources; d) the allocation or reallocation of responsibilities and authorities."
  },
  { 
    code: "7.1.1", 
    title: "Resources - General",
    content: "The organization shall determine and provide the resources needed for the establishment, implementation, maintenance and continual improvement of the quality management system. The organization shall consider: a) the capabilities of, and constraints on, existing internal resources; b) what needs to be obtained from external providers."
  },
  { 
    code: "7.1.2", 
    title: "People",
    content: "The organization shall determine and provide the persons necessary for the effective implementation of its quality management system and for the operation and control of its processes."
  },
  { 
    code: "7.1.3", 
    title: "Infrastructure",
    content: "The organization shall determine, provide and maintain the infrastructure necessary for the operation of its processes and to achieve conformity of products and services."
  },
  { 
    code: "7.1.4", 
    title: "Environment for the operation of processes",
    content: "The organization shall determine, provide and maintain the environment necessary for the operation of its processes and to achieve conformity of products and services."
  },
  { 
    code: "7.1.5.1", 
    title: "Monitoring and measuring resources - General",
    content: "The organization shall determine and provide the resources needed to ensure valid and reliable results when monitoring or measuring is used to verify the conformity of products and services to requirements. The organization shall ensure that the resources provided: a) are suitable for the specific type of monitoring and measurement activities being undertaken; b) are maintained to ensure their continuing fitness for their purpose. The organization shall retain appropriate documented information as evidence of fitness for purpose of the monitoring and measurement resources."
  },
  { 
    code: "7.1.5.2", 
    title: "Measurement traceability",
    content: "When measurement traceability is a requirement, or is considered by the organization to be an essential part of providing confidence in the validity of measurement results, measuring equipment shall be: a) calibrated or verified, or both, at specified intervals, or prior to use, against measurement standards traceable to international or national measurement standards; b) identified in order to determine their status; c) safeguarded from adjustments, damage or deterioration that would invalidate the calibration status and subsequent measurement results."
  },
  { 
    code: "7.1.6", 
    title: "Organizational knowledge",
    content: "The organization shall determine the knowledge necessary for the operation of its processes and to achieve conformity of products and services. This knowledge shall be maintained and be made available to the extent necessary. When addressing changing needs and trends, the organization shall consider its current knowledge and determine how to acquire or access any necessary additional knowledge and required updates."
  },
  { 
    code: "7.2", 
    title: "Competence",
    content: "The organization shall: a) determine the necessary competence of person(s) doing work under its control that affects the performance and effectiveness of the quality management system; b) ensure that these persons are competent on the basis of appropriate education, training, or experience; c) where applicable, take actions to acquire the necessary competence, and evaluate the effectiveness of the actions taken; d) retain appropriate documented information as evidence of competence."
  },
  { 
    code: "7.3", 
    title: "Awareness",
    content: "The organization shall ensure that persons doing work under the organization’s control are aware of: a) the quality policy; b) relevant quality objectives; c) their contribution to the effectiveness of the quality management system, including the benefits of improved performance; d) the implications of not conforming with the quality management system requirements."
  },
  { 
    code: "7.4", 
    title: "Communication",
    content: "The organization shall determine the internal and external communications relevant to the quality management system, including: a) on what it will communicate; b) when to communicate; c) with whom to communicate; d) how to communicate; e) who communicates."
  },
  { 
    code: "7.5.1", 
    title: "Documented information - General",
    content: "The organization’s quality management system shall include: a) documented information required by this International Standard; b) documented information determined by the organization as being necessary for the effectiveness of the quality management system."
  },
  { 
    code: "7.5.2", 
    title: "Creating and updating documented information",
    content: "When creating and updating documented information, the organization shall ensure appropriate: a) identification and description (e.g. a title, date, author, or reference number); b) format (e.g. language, software version, graphics) and media (e.g. paper, electronic); c) review and approval for suitability and adequacy."
  },
  { 
    code: "7.5.3.1", 
    title: "Control of documented information - Availability and Protection",
    content: "Documented information required by the quality management system and by this International Standard shall be controlled to ensure: a) it is available and suitable for use, where and when it is needed; b) it is adequately protected (e.g. from loss of confidentiality, improper use, or loss of integrity)."
  },
  { 
    code: "7.5.3.2", 
    title: "Control of documented information - Activities",
    content: "For the control of documented information, the organization shall address the following activities, as applicable: a) distribution, access, retrieval and use; b) storage and preservation, including preservation of legibility; c) control of changes (e.g. version control); d) retention and disposition. Documented information of external origin determined by the organization to be necessary for the planning and operation of the quality management system shall be identified as appropriate, and be controlled."
  },
  { 
    code: "8.1", 
    title: "Operational planning and control",
    content: "The organization shall plan, implement and control the processes (see 4.4) needed to meet the requirements for the provision of products and services, and to implement the actions determined in Clause 6, by: a) determining the requirements for the products and services; b) establishing criteria for: 1. the processes; 2. the acceptance of products and services; c) determining the resources needed to achieve conformity to the product and service requirements; d) implementing control of the processes in accordance with the criteria; e) determining, maintaining and retaining documented information to the extent necessary: 1. to have confidence that the processes have been carried out as planned; 2. to demonstrate the conformity of products and services to their requirements."
  },
  { 
    code: "8.2.1", 
    title: "Customer communication",
    content: "Communication with customers shall include: a) providing information relating to products and services; b) handling enquiries, contracts or orders, including changes; c) obtaining customer feedback relating to products and services, including customer complaints; d) handling or controlling customer property; e) establishing specific requirements for contingency actions, when relevant."
  },
  { 
    code: "8.2.2", 
    title: "Determining the requirements for products and services",
    content: "When determining the requirements for the products and services to be offered to customers, the organization shall ensure that: a) the requirements for the products and services are defined, including: 1. any applicable statutory and regulatory requirements; 2. those considered necessary by the organization; b) the organization can meet the claims for the products and services it offers."
  },
  { 
    code: "8.2.3.1", 
    title: "Review of the requirements for products and services",
    content: "The organization shall ensure that it has the ability to meet the requirements for products and services to be offered to customers. The organization shall conduct a review before committing to supply products and services to a customer, to include: a) requirements specified by the customer, including the requirements for delivery and post-delivery activities; b) requirements not stated by the customer, but necessary for the specified or intended use, when known; c) requirements specified by the organization; d) statutory and regulatory requirements applicable to the products and services; e) contract or order requirements differing from those previously expressed. The organization shall ensure that contract or order requirements differing from those previously defined are resolved."
  },
  { 
    code: "8.2.3.2", 
    title: "Review of requirements - Documented Information",
    content: "The organization shall retain documented information, as applicable: a) on the results of the review; b) on any new requirements for the products and services."
  },
  { 
    code: "8.2.4", 
    title: "Changes to requirements for products and services",
    content: "The organization shall ensure that relevant documented information is amended, and that relevant persons are made aware of the changed requirements, when the requirements for products and services are changed."
  },
  { 
    code: "8.3.1", 
    title: "Design and development - General",
    content: "The organization shall establish, implement and maintain a design and development process that is appropriate to ensure the subsequent provision of products and services."
  },
  { 
    code: "8.3.2", 
    title: "Design and development planning",
    content: "In determining the stages and controls for design and development, the organization shall consider: a) the nature, duration and complexity of the design and development activities; b) the required process stages, including applicable design and development reviews; c) the required design and development verification and validation activities; d) the responsibilities and authorities involved in the design and development process; e) the internal and external resource needs; f) the need to control interfaces; g) the need for involvement of customers and users; h) the requirements for subsequent provision of products and services; i) the level of control expected by customers and other interested parties; j) the documented information needed to demonstrate that design and development requirements have been met."
  },
  { 
    code: "8.3.3", 
    title: "Design and development inputs",
    content: "The organization shall determine the requirements essential for the specific types of products and services to be designed and developed. The organization shall consider: a) functional and performance requirements; b) information derived from previous similar design and development activities; c) statutory and regulatory requirements; d) standards or codes of practice that the organization has committed to implement; e) potential consequences of failure. Inputs shall be adequate for design and development purposes, complete and unambiguous. Conflicting inputs shall be resolved."
  },
  { 
    code: "8.3.4", 
    title: "Design and development controls",
    content: "The organization shall apply controls to the design and development process to ensure that: a) the results to be achieved are defined; b) reviews are conducted to evaluate the ability of the results of design and development to meet requirements; c) verification activities are conducted to ensure that the design and development outputs meet the input requirements; d) validation activities are conducted to ensure that the resulting products and services meet the requirements for the specified application or intended use; e) any necessary actions are taken on problems determined during the reviews, or verification and validation activities; f) documented information of these activities is retained."
  },
  { 
    code: "8.3.5", 
    title: "Design and development outputs",
    content: "The organization shall ensure that design and development outputs: a) meet the input requirements; b) are adequate for the subsequent processes for the provision of products and services; c) include or reference monitoring and measuring requirements, as appropriate, and acceptance criteria; d) specify the characteristics of the products and services that are essential for their intended purpose and their safe and proper provision. The organization shall retain documented information on design and development outputs."
  },
  { 
    code: "8.3.6", 
    title: "Design and development changes",
    content: "The organization shall identify, review and control changes made during, or subsequent to, the design and development of products and services, to the extent necessary to ensure that there is no adverse impact on conformity to requirements. The organization shall retain documented information on: a) design and development changes; b) the results of reviews; c) the authorization of the changes; d) the actions taken to prevent adverse impacts."
  },
  { 
    code: "8.4.1", 
    title: "Control of externally provided processes, products and services - General",
    content: "The organization shall ensure that externally provided processes, products and services conform to requirements. The organization shall determine the controls to be applied to externally provided processes, products and services when: a) products and services from external providers are intended for incorporation into the organization’s own products and services; b) products and services are provided directly to the customer(s) by external providers on behalf of the organization; c) a process, or part of a process, is provided by an external provider as a result of a decision by the organization. The organization shall determine and apply criteria for the evaluation, selection, monitoring of performance, and re-evaluation of external providers."
  },
  { 
    code: "8.4.2", 
    title: "Type and extent of control",
    content: "The organization shall ensure that externally provided processes, products and services do not adversely affect the organization’s ability to consistently deliver conforming products and services to its customers. The organization shall: a) ensure that externally provided processes remain within the control of its quality management system; b) define both the controls that it intends to apply to an external provider and those it intends to apply to the resulting output; c) take into consideration: 1. the potential impact of the externally provided processes, products and services on the organization’s ability to consistently meet customer and applicable statutory and regulatory requirements; 2. the effectiveness of the controls applied by the external provider; d) determine the verification, or other activities, necessary to ensure that the externally provided processes, products and services meet requirements."
  },
  { 
    code: "8.4.3", 
    title: "Information for external providers",
    content: "The organization shall ensure the adequacy of requirements prior to their communication to the external provider. The organization shall communicate to external providers its requirements for: a) the processes, products and services to be provided; b) the approval of: 1. products and services; 2. methods, processes and equipment; 3. the release of products and services; c) competence, including any required qualification of persons; d) the external providers’ interactions with the organization; e) control and monitoring of the external providers’ performance to be applied by the organization; f) verification or validation activities that the organization, or its customer, intends to perform at the external providers’ premises."
  },
  { 
    code: "8.5.1", 
    title: "Control of production and service provision",
    content: "The organization shall implement production and service provision under controlled conditions. Controlled conditions shall include, as applicable: a) the availability of documented information that defines: 1. the characteristics of the products to be produced, the services to be provided, or the activities to be performed; 2. the results to be achieved; b) the availability and use of suitable monitoring and measuring resources; c) the implementation of monitoring and measurement activities at appropriate stages to verify that criteria for control of processes or outputs, and acceptance criteria for products and services, have been met; d) the use of suitable infrastructure and environment for the operation of processes; e) the appointment of competent persons, including any required qualification; f) the validation, and periodic revalidation, of the ability to achieve planned results of the processes for production and service provision, where the resulting output cannot be verified by subsequent monitoring or measurement; g) the implementation of actions to prevent human error; h) the implementation of release, delivery and post-delivery activities."
  },
  { 
    code: "8.5.2", 
    title: "Identification and traceability",
    content: "The organization shall use suitable means to identify outputs when it is necessary to ensure the conformity of products and services. The organization shall identify the status of outputs with respect to monitoring and measurement requirements throughout production and service provision. The organization shall control the unique identification of the outputs when traceability is a requirement, and shall retain the documented information necessary to enable traceability."
  },
  { 
    code: "8.5.3", 
    title: "Property belonging to customers or external providers",
    content: "The organization shall exercise care with property belonging to customers or external providers while it is under the organization’s control or being used by the organization. The organization shall identify, verify, protect and safeguard customers’ or external providers’ property provided for use or incorporation into the products and services. When the property of a customer or external provider is lost, damaged or otherwise found to be unsuitable for use, the organization shall report this to the customer or external provider and retain documented information on what has occurred."
  },
  { 
    code: "8.5.4", 
    title: "Preservation",
    content: "The organization shall preserve the outputs during production and service provision, to the extent necessary to ensure conformity to requirements. NOTE: Preservation can include identification, handling, contamination control, packaging, storage, transmission or transportation, and protection."
  },
  { 
    code: "8.5.5", 
    title: "Post-delivery activities",
    content: "The organization shall meet requirements for post-delivery activities associated with the products and services. In determining the extent of post-delivery activities that are required, the organization shall consider: a) statutory and regulatory requirements; b) the potential undesired consequences associated with its products and services; c) the nature, use and intended lifetime of its products and services; d) customer requirements; e) customer feedback."
  },
  { 
    code: "8.5.6", 
    title: "Control of changes",
    content: "The organization shall review and control changes for production or service provision, to the extent necessary to ensure continuing conformity with requirements. The organization shall retain documented information describing the results of the review of changes, the person(s) authorizing the change, and any necessary actions arising from the review."
  },
  { 
    code: "8.6", 
    title: "Release of products and services",
    content: "The organization shall implement planned arrangements, at appropriate stages, to verify that the product and service requirements have been met. The release of products and services to the customer shall not proceed until the planned arrangements have been satisfactorily completed, unless otherwise approved by a relevant authority and, as applicable, by the customer. The organization shall retain documented information on the release of products and services. The documented information shall include: a) evidence of conformity with the acceptance criteria; b) traceability to the person(s) authorizing the release."
  },
  { 
    code: "8.7.1", 
    title: "Control of nonconforming outputs",
    content: "The organization shall ensure that outputs that do not conform to their requirements are identified and controlled to prevent their unintended use or delivery. The organization shall take appropriate action based on the nature of the nonconformity and its effect on the conformity of products and services. This shall also apply to nonconforming products and services detected after delivery of products, during or after the provision of services. The organization shall deal with nonconforming outputs in one or more of the following ways: a) correction; b) segregation, containment, return or suspension of provision of products and services; c) informing the customer; d) obtaining authorization for acceptance under concession. Conformity to the requirements shall be verified when nonconforming outputs are corrected."
  },
  { 
    code: "8.7.2", 
    title: "Nonconforming outputs - Documented Information",
    content: "The organization shall retain documented information that: a) describes the nonconformity; b) describes the actions taken; c) describes any concessions obtained; d) identifies the authority deciding the action in respect of the nonconformity."
  },
  { 
    code: "9.1.1", 
    title: "Monitoring, measurement, analysis and evaluation - General",
    content: "The organization shall determine: a) what needs to be monitored and measured; b) the methods for monitoring, measurement, analysis and evaluation needed to ensure valid results; c) when the monitoring and measuring shall be performed; d) when the results from monitoring and measurement shall be analysed and evaluated. The organization shall evaluate the performance and the effectiveness of the quality management system. The organization shall retain appropriate documented information as evidence of the results."
  },
  { 
    code: "9.1.2", 
    title: "Customer satisfaction",
    content: "The organization shall monitor customers’ perceptions of the degree to which their needs and expectations have been fulfilled. The organization shall determine the methods for obtaining, monitoring and reviewing this information."
  },
  { 
    code: "9.1.3", 
    title: "Analysis and evaluation",
    content: "The organization shall analyse and evaluate appropriate data and information arising from monitoring and measurement. The results of analysis shall be used to evaluate: a) conformity of products and services; b) the degree of customer satisfaction; c) the performance and effectiveness of the quality management system; d) if planning has been implemented effectively; e) the effectiveness of actions taken to address risks and opportunities; f) the performance of external providers; g) the need for improvements to the quality management system."
  },
  { 
    code: "9.2.1", 
    title: "Internal audit - General",
    content: "The organization shall conduct internal audits at planned intervals to provide information on whether the quality management system: a) conforms to: 1. the organization’s own requirements for its quality management system; 2. the requirements of this International Standard; b) is effectively implemented and maintained."
  },
  { 
    code: "9.2.2", 
    title: "Internal audit programme",
    content: "The organization shall: a) plan, establish, implement and maintain an audit programme(s) including the frequency, methods, responsibilities, planning requirements and reporting, which shall take into consideration the importance of the processes concerned, changes affecting the organization, and the results of previous audits; b) define the audit criteria and scope for each audit; c) select auditors and conduct audits to ensure objectivity and the impartiality of the audit process; d) ensure that the results of the audits are reported to relevant management; e) take appropriate correction and corrective actions without undue delay; f) retain documented information as evidence of the implementation of the audit programme and the audit results."
  },
  { 
    code: "9.3.1", 
    title: "Management review - General",
    content: "Top management shall review the organization’s quality management system, at planned intervals, to ensure its continuing suitability, adequacy, effectiveness and alignment with the strategic direction of the organization."
  },
  { 
    code: "9.3.2", 
    title: "Management review inputs",
    content: "The management review shall be planned and carried out taking into consideration: a) the status of actions from previous management reviews; b) changes in external and internal issues that are relevant to the quality management system; c) information on the performance and effectiveness of the quality management system, including trends in: 1. customer satisfaction and feedback from relevant interested parties; 2. the extent to which quality objectives have been met; 3. process performance and conformity of products and services; 4. nonconformities and corrective actions; 5. monitoring and measurement results; 6. audit results; 7. the performance of external providers; d) the adequacy of resources; e) the effectiveness of actions taken to address risks and opportunities; f) opportunities for improvement."
  },
  { 
    code: "9.3.3", 
    title: "Management review outputs",
    content: "The outputs of the management review shall include decisions and actions related to: a) opportunities for improvement; b) any need for changes to the quality management system; c) resource needs. The organization shall retain documented information as evidence of the results of management reviews."
  },
  { 
    code: "10.1", 
    title: "Improvement - General",
    content: "The organization shall determine and select opportunities for improvement and implement any necessary actions to meet customer requirements and enhance customer satisfaction. These shall include: a) improving products and services to meet requirements as well as to address future needs and expectations; b) correcting, preventing or reducing undesired effects; c) improving the performance and effectiveness of the quality management system."
  },
  { 
    code: "10.2.1", 
    title: "Nonconformity and corrective action",
    content: "When a nonconformity occurs, including any arising from complaints, the organization shall: a) react to the nonconformity and, as applicable: 1. take action to control and correct it; 2. deal with the consequences; b) evaluate the need for action to eliminate the cause(s) of the nonconformity, in order that it does not recur or occur elsewhere, by: 1. reviewing and analysing the nonconformity; 2. determining the causes of the nonconformity; 3. determining if similar nonconformities exist, or could potentially occur; c) implement any action needed; d) review the effectiveness of any corrective action taken; e) update risks and opportunities determined during planning, if necessary; f) make changes to the quality management system, if necessary. Corrective actions shall be appropriate to the effects of the nonconformities encountered."
  },
  { 
    code: "10.2.2", 
    title: "Nonconformity - Documented Information",
    content: "The organization shall retain documented information as evidence of: a) the nature of the nonconformities and any subsequent actions taken; b) the results of any corrective action."
  },
  { 
    code: "10.3", 
    title: "Continual improvement",
    content: "The organization shall continually improve the suitability, adequacy and effectiveness of the quality management system. The organization shall consider the results of analysis and evaluation, and the outputs from management review, to determine if there are needs or opportunities that shall be addressed as part of continual improvement."
  }
];

export enum CARStatus {
  OPEN = 'OPEN',               // Issued by QA, waiting for Section
  RESPONDED = 'RESPONDED',     // Answered by Section, waiting for QA Review
  RETURNED = 'RETURNED',       // Rejected by QA, sent back to Section
  ACCEPTED = 'ACCEPTED',       // Accepted by QA, now "FOR IMPLEMENTATION" for Section
  FOR_VERIFICATION = 'FOR_VERIFICATION', // Section Implemented, waiting for QA Verification
  VERIFIED = 'VERIFIED',       // Verified by QA (Effective), waiting for DQMR Validation
  CLOSED = 'CLOSED',           // Validated by DQMR
  INEFFECTIVE = 'INEFFECTIVE'  // Verified by QA as ineffective (trigger new CAR)
}

export enum AuditAction {
  CAR_CREATED = 'CAR_CREATED',
  RESPONSE_SUBMITTED = 'RESPONSE_SUBMITTED',
  PLAN_RETURNED = 'PLAN_RETURNED',
  PLAN_ACCEPTED = 'PLAN_ACCEPTED',
  IMPLEMENTATION_COMPLETED = 'IMPLEMENTATION_COMPLETED',
  IMPLEMENTATION_REVOKED = 'IMPLEMENTATION_REVOKED',
  VERIFIED_EFFECTIVE = 'VERIFIED_EFFECTIVE',
  VERIFIED_INEFFECTIVE = 'VERIFIED_INEFFECTIVE',
  VALIDATED_AND_CLOSED = 'VALIDATED_AND_CLOSED',
  CAR_DELETED = 'CAR_DELETED'
}

export interface AuditTrailEntry {
  id: string;
  createdAt: string;
  carId: string;
  userName: string;
  userRole: Role;
  action: AuditAction;
  details?: {
    remarks?: string;
    followUpComment?: string;
  };
}

export interface NonConformanceDetails {
  statement: string;
  evidence: string;
  reference: string;
}

export interface RemedialAction {
  id: string;
  action: string;
}

export interface CorrectiveAction {
  id: string;
  action: string;
  personResponsible: string;
  expectedDate: string;
}

export interface RootCause {
  id: string;
  cause: string;
}

export interface RCAChain {
  id: string;
  category?: string; // e.g. 'PEOPLE', 'METHODS' - kept for compatibility but not manually used
  whys: string[]; // Reused to store Factors
}

export interface ParetoItem {
  id: string; // Links to RCAChain id
  cause: string; // Derived from the last 'why'
  frequency: number;
}

export interface RCAData {
  chains: RCAChain[];
  paretoItems: ParetoItem[];
  rootCauseHypothesis?: string; // New field for the final hypothesis
}

export interface RegistryEntry {
  id: string;
  carId: string;
  section: string;
  requiredDocument: string;
  originalDueDate: string;
  dateReminderSent: string;
  reasonForNonSubmission: string;
  correctiveActionForLateness: string;
  dateSubmitted?: string;
  status: 'Open' | 'Closed';
  dateClosed?: string;
}

export interface CAR {
  id: string;
  refNo: string;
  department: string;
  isoClause: string;
  carNo: string;
  source: 'Internal Audit' | 'KPI' | 'DOH' | 'IPC' | 'PhilHealth' | 'Incident Management System' | 'Others';
  otherSourceSpecify?: string;
  dateOfAudit: string;
  
  // Non Conformance
  description: NonConformanceDetails;
  issuedBy: string;
  dateIssued: string; // Used to calc deadline (5 days)

  // Response (Section)
  acknowledgedBy?: string;
  dateAcknowledged?: string;
  
  // RCA
  rcaData: RCAData;
  causeOfNonConformance?: string; // Summary field (optional, can be derived from RCA)

  remedialActions: RemedialAction[];
  correctiveActions: CorrectiveAction[];
  rootCauses: RootCause[];
  dateResponseSubmitted?: string;

  // Review (QA)
  acceptedBy?: string;
  dateAccepted?: string;
  isReturned?: boolean; // If true, it was sent back for revision
  returnRemarks?: string; // Remarks from QA when Accepting or Returning

  // Verification (QA)
  followUpComment?: string;
  isEffective?: boolean; // true = close/log, false = issue new CAR
  isCleared?: boolean;
  verifiedBy?: string;
  dateVerified?: string;

  // Validation (DQMR)
  validatedBy?: string;
  dateValidated?: string;

  // System Flags
  status: CARStatus;
  isLate: boolean;
  dueDate: string; // Calculated field stored for ease
}