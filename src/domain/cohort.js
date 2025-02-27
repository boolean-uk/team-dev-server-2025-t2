import dbClient from '../utils/dbClient.js'

/**
 * Create a new Cohort in the database
 * @returns {Cohort}
 */
export async function createCohort() {
  const createdCohort = await dbClient.cohort.create({
    data: {
      type: 'SOFTWARE_DEVELOPMENT' // Default type
    }
  })

  return new Cohort(createdCohort.id)
}

export class Cohort {
  constructor(id = null, type = null) {
    this.id = id
    this.type = type
  }

  toJSON() {
    return {
      cohort: {
        id: this.id,
        type: this.type
      }
    }
  }
}
