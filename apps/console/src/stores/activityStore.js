import { create } from "zustand"

export const useActivityStore = create(set => ({
  events: [],
  addEvent: (event) =>
    set(state => ({
      events: [
        { id: Date.now(), ...event },
        ...state.events
      ]
    }))
}))
