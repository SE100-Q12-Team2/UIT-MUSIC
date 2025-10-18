export const generateActionJobIdName = ({ expectedJobName, queueId }: { queueId: number; expectedJobName: string }) =>
  `${expectedJobName}-${queueId}`
