import Vue from 'vue'
import CaravanPlayer from './CaravanPlayer.vue'
import store from './store'

Vue.config.productionTip = false

new Vue({
  store,
  render: h => h(CaravanPlayer)
}).$mount('#caravanPlayer')
