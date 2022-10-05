const queryServiceEvents = `
  query serviceEvents($serviceId: String!, $before: Time, $limit: Int) {
    serviceEvents(serviceId: $serviceId, before: $before, limit: $limit) {
      hasMore
      events {
        ...allServiceEvents
        __typename
      }
      __typename
    }
  }

  fragment allServiceEvents on ServiceEvent {
    ...serviceEventFields
    ...buildEndedFields
    ...buildStartedFields
    ...cronJobRunEndedFields
    ...cronJobRunStartedFields
    ...deployEndedFields
    ...deployStartedFields
    ...serverFailedFields
    ...suspenderAddedFields
    ...suspenderRemovedFields
    ...planChangedFields
    ...extraInstancesChangedFields
    ...branchDeletedFields
    ...autoscalingConfigChangedFields
    ...autoscalingStartedFields
    ...autoscalingEndedFields
    ...initialDeployHookStartedFields
    ...initialDeployHookEndedFields
    ...commitIgnoredFields
    ...userServerUnhealthyFields
    ...maintenanceStartedFields
    ...maintenanceEndedFields
    __typename
  }

  fragment serviceEventFields on ServiceEvent {
    id
    timestamp
    __typename
  }

  fragment buildEndedFields on BuildEnded {
    buildId
    build {
      id
      commitShortId
      commitMessage
      commitURL
      __typename
    }
    status
    reason {
      ...buildDeployEndReasonFields
      __typename
    }
    __typename
  }

  fragment buildDeployEndReasonFields on BuildDeployEndReason {
    buildFailed {
      id
      __typename
    }
    newBuild {
      id
      __typename
    }
    newDeploy {
      id
      __typename
    }
    failure {
      ...failureReasonFields
      __typename
    }
    timedOutSeconds
    __typename
  }

  fragment failureReasonFields on FailureReason {
    evicted
    nonZeroExit
    oomKilled {
      memoryLimit
      __typename
    }
    timedOutSeconds
    unhealthy
    step
    __typename
  }

  fragment buildStartedFields on BuildStarted {
    buildId
    build {
      id
      commitShortId
      commitMessage
      commitURL
      __typename
    }
    trigger {
      ...buildDeployTriggerFields
      __typename
    }
    __typename
  }

  fragment buildDeployTriggerFields on BuildDeployTrigger {
    firstBuild
    clusterSynced
    envUpdated
    manual
    clearCache
    user {
      id
      email
      __typename
    }
    updatedProperty
    newCommit
    system
    rollback
    rollbackTargetDeployID
    __typename
  }

  fragment cronJobRunEndedFields on CronJobRunEnded {
    cronJobRunId
    cronJobRun {
      id
      status
      __typename
    }
    status
    newRun {
      id
      __typename
    }
    reason {
      ...failureReasonFields
      __typename
    }
    user {
      id
      email
      __typename
    }
    __typename
  }

  fragment cronJobRunStartedFields on CronJobRunStarted {
    cronJobRunId
    cronJobRun {
      id
      status
      __typename
    }
    triggeredByUser {
      id
      email
      __typename
    }
    __typename
  }

  fragment deployEndedFields on DeployEnded {
    deployId
    deploy {
      id
      status
      commitShortId
      commitMessage
      commitURL
      rollbackSupportStatus
      __typename
    }
    status
    reason {
      ...buildDeployEndReasonFields
      __typename
    }
    __typename
  }

  fragment deployStartedFields on DeployStarted {
    deployId
    deploy {
      id
      status
      commitShortId
      commitMessage
      commitURL
      rollbackSupportStatus
      __typename
    }
    trigger {
      ...buildDeployTriggerFields
      __typename
    }
    __typename
  }

  fragment serverFailedFields on ServerFailed {
    reason {
      ...failureReasonFields
      __typename
    }
    __typename
  }

  fragment suspenderAddedFields on SuspenderAdded {
    actor
    suspendedByUser {
      id
      email
      __typename
    }
    __typename
  }

  fragment suspenderRemovedFields on SuspenderRemoved {
    actor
    resumedByUser {
      id
      email
      __typename
    }
    __typename
  }

  fragment planChangedFields on PlanChanged {
    from
    to
    __typename
  }

  fragment extraInstancesChangedFields on ExtraInstancesChanged {
    fromInstances
    toInstances
    __typename
  }

  fragment branchDeletedFields on BranchDeleted {
    deletedBranch
    newBranch
    __typename
  }

  fragment autoscalingConfigChangedFields on AutoscalingConfigChanged {
    config {
      enabled
      min
      max
      cpuPercentage
      cpuEnabled
      memoryPercentage
      memoryEnabled
      __typename
    }
    __typename
  }

  fragment autoscalingStartedFields on AutoscalingStarted {
    fromInstances
    toInstances
    __typename
  }

  fragment autoscalingEndedFields on AutoscalingEnded {
    fromInstances
    toInstances
    __typename
  }

  fragment initialDeployHookStartedFields on InitialDeployHookStarted {
    deployId
    service {
      id
      userFacingTypeSlug
      __typename
    }
    __typename
  }

  fragment initialDeployHookEndedFields on InitialDeployHookEnded {
    deployId
    service {
      id
      userFacingTypeSlug
      __typename
    }
    commandStatus: status
    __typename
  }

  fragment commitIgnoredFields on CommitIgnored {
    service {
      id
      __typename
    }
    commit
    commitUrl
    __typename
  }

  fragment userServerUnhealthyFields on UserServerUnhealthy {
    service {
      id
      __typename
    }
    message
    __typename
  }

  fragment maintenanceStartedFields on MaintenanceStarted {
    service {
      id
      __typename
    }
    trigger {
      ...maintenanceTriggerFields
      __typename
    }
    __typename
  }

  fragment maintenanceTriggerFields on MaintenanceTrigger {
    manual
    system
    user {
      id
      email
      __typename
    }
    __typename
  }

  fragment maintenanceEndedFields on MaintenanceEnded {
    service {
      id
      __typename
    }
    __typename
  }
`;

const queryServiceLogs = `
  query serviceLogs($serviceId: String!) {
    serviceLogs(serviceId: $serviceId) {
      ...logEntryFields
      __typename
    }
  }

  fragment logEntryFields on LogEntry {
    id
    serviceId
    buildId
    deployId
    timestamp
    text
    __typename
  }
`;

module.exports = {
  queryServiceEvents,
  queryServiceLogs,
};
