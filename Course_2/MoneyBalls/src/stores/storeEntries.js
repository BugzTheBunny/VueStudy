import { defineStore } from 'pinia'
import { ref, computed, reactive, nextTick } from 'vue'
import { Notify } from 'quasar'
import { useShowErrorMessage } from 'src/use/useShowErrorMessage'
import { useNoneReactiveCopy } from 'src/use/useNoneReactiveCopy'
import { useStoreAuth } from 'src/stores/storeAuth'
import supabase from 'src/config/supabase'

export const useStoreEntries = defineStore('entries', () => {

  /*
    state
  */

    const entries = ref([
      // {
      //   id: 'id1',
      //   name: 'Salary',
      //   amount: 4999.99,
      //   paid: true,
      //   order: 1,
      //   user_id: 'user-id-123',
      // },
      // {
      //   id: 'id2',
      //   name: 'Rent',
      //   amount: -999,
      //   paid: false,
      //   order: 2,
      //   user_id: 'user-id-123',
      // },
      // {
      //   id: 'id3',
      //   name: 'Phone bill',
      //   amount: -14.99,
      //   paid: false,
      //   order: 3,
      //   user_id: 'user-id-123',
      // },
      // {
      //   id: 'id4',
      //   name: 'Unknown',
      //   amount: 0,
      //   paid: false,
      //   order: 4,
      //   user_id: 'user-id-123',
      // },
    ])

    const entriesLoaded = ref(false)

    const options = reactive({
      sort: false
    })

  /*
    getters
  */

    const balance = computed(() => {
      return entries.value.reduce((accumulator, { amount }) => {
        return accumulator + amount
      }, 0)
    })

    const balancePaid = computed(() => {
      return entries.value.reduce((accumulator, { amount, paid }) => {
        return paid ? accumulator + amount : accumulator
      }, 0)
    })

    const runningBalances = computed(() => {
      let runningBalances = [],
          currentRunningBalance = 0

      if (entries.value.length) {
        entries.value.forEach(entry => {
          let entryAmount = entry.amount ? entry.amount : 0
          currentRunningBalance = currentRunningBalance + entryAmount
          runningBalances.push(currentRunningBalance)
        })
      }

      return runningBalances
    })

  /*
    actions
  */

    const loadEntries = async () => {
      loadEntries.value = false
      const storeAuth = useStoreAuth()

      let { data, error } = await supabase
        .from('entries')
        .select('*')
        .eq('user_id', storeAuth.userDetails.id)
        .order('order', { ascending: false })

      if (error) useShowErrorMessage(error?.message || 'Failed to load entries')
      if (data) {
        entries.value = data
        entriesLoaded.value = true
        subscribeEntries()
      }
    }

    const subscribeEntries = () => {
      const storeAuth = useStoreAuth()
      supabase.channel('entries_channel')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'entries' ,filter: `user_id=eq.${storeAuth.userDetails.id}`},
        (payload) => {
          if (payload.eventType === 'INSERT') {
            entries.value.push(payload.new)
          }
          if (payload.eventType === 'DELETE') {
            const index = getEntryIndexById(payload.old.id)
            if (index !== -1) {
              entries.value.splice(index, 1)
            }
          }

          if (payload.eventType === 'UPDATE') {
            const index = getEntryIndexById(payload.new.id)
            if (index !== -1) {
              Object.assign(entries.value[index], payload.new)
            }
        }}
      )
      .subscribe()
    }

    const addEntry = async addEntryForm => {
      const storeAuth = useStoreAuth()
      const newEntry = Object.assign({}, addEntryForm, {
         paid: false,
         order: generateOrderNumber(),
         user_id: storeAuth.userDetails.id
        })
      if (newEntry.amount ===  null) newEntry.amount = 0
      const { error } = await supabase
        .from('entries')
        .insert([
          newEntry
        ])
        .select()

      if (error) {
        useShowErrorMessage(error?.message || 'Failed to add entry')
      }
    }

    const deleteEntry = entryId => {
      const index = getEntryIndexById(entryId)
      supabase
        .from('entries')
        .delete()
        .eq('id', entryId)
        .then(({ error }) => {
          if (error) {
            useShowErrorMessage(error?.message || 'Failed to delete entry')
          }
        })
      removeSlideItemIfExists(entryId)
      Notify.create({
        message: 'Entry deleted',
        position: 'top'
      })
    }

    const updateEntry = async (entryId, updates) => {

      const index = getEntryIndexById(entryId),
        oldEntry = useNoneReactiveCopy(entries.value[index])
      Object.assign(entries.value[index], updates)

      const { error } = await supabase
        .from('entries')
        .update(updates)
        .eq('id', entryId)
        .select()
      if (error) {
        useShowErrorMessage(error?.message || 'Failed to update entry')
        Object.assign(entries.value[index], oldEntry)
      }
    }

    const updateEntryOrderNumbers = async () => {
      let currentOrder = 1
      entries.value.forEach(entry => {
        entry.order = currentOrder
        currentOrder++
      })

      const entriesUpsert = entries.value.map(entry => {
        return {
          id: entry.id,
          order: entry.order
        }
      })

      const { error } = await supabase
      .from('entries')
      .upsert(entriesUpsert)
      .select()

      if (error) {
        useShowErrorMessage(error?.message || 'Failed to update entry order numbers')
      }
    }

    const sortEnd = ({ oldIndex, newIndex }) => {
      const movedEntry = entries.value[oldIndex]
      entries.value.splice(oldIndex, 1)
      entries.value.splice(newIndex, 0, movedEntry)
      updateEntryOrderNumbers()
    }

  /*
    helpers
  */

    const generateOrderNumber = () => {
      const orderNumbers = entries.value.map(entry => entry.order),
        newOrderNumber = orderNumbers.length
                          ? Math.max(...orderNumbers) + 1
                          : 1
      return newOrderNumber
    }

    const getEntryIndexById = entryId => {
      return entries.value.findIndex(entry => entry.id === entryId)
    }

    const removeSlideItemIfExists = entryId => {
      // hacky fix: when deleting (after sorting),
      // sometimes the slide item is not removed
      // from the dom. this will remove the slide
      // item from the dom if it still exists
      // (after entry removed from entries array)
      nextTick(() => {
        const slideItem = document.querySelector(`#id-${ entryId }`)
        if (slideItem) slideItem.remove()
      })
    }


  /*
    return
  */

    return {

      // state
      entries,
      entriesLoaded,
      options,

      // getters
      balance,
      balancePaid,
      runningBalances,

      // actions
      loadEntries,
      addEntry,
      deleteEntry,
      updateEntry,
      sortEnd,
    }

})
