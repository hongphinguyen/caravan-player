<template>
  <div class="outer-bar" :style="outerSize" ref="outerBar">
    <div :class="`inner-bar ${orientation}`" ref="innerBar" :style="innerSize">
    </div>
    <div class="overlay" @click="barClick" @mousedown="addBarListener"
         @mouseup="removeBarListener" @mouseout="removeBarListener">
    </div>
  </div>
</template>

<script lang="ts">
import { Component, Vue, Prop } from 'vue-property-decorator';

@Component
export default class Slider extends Vue {
  @Prop() private boundValue!: number;
  @Prop() private clickEvent!: any;
  @Prop() private orientation!: string;
  @Prop() private maxWidth!: number;
  @Prop() private size!: { height: string, weight: string };
  @Prop() private additionalStyle!: object;
  private mouseOver = true;
  private event: any = {};
  private eventHandler: any = (event: MouseEvent) => this.barClick(event);
  private get outerSize(): object {
    const outerSize = this.size ? this.size :
      this.orientation === 'horizontal' ? { height: '50px', width: '500px' } : { height: '500px', width: '50px' };
    return this.additionalStyle ? Object.assign(this.additionalStyle, outerSize) : outerSize;
  }
  private get innerSize(): object {
    return this.orientation === 'horizontal' ? { height: 'calc(100% - 2px)', width: this.boundValue + '%' }
      : { width: 'calc(100% - 2px)', height: `calc(${100 - this.boundValue}% - 2px)` };
  }
  private barClick(event: MouseEvent): void {
    const clickPos = this.orientation === 'horizontal' ? event.offsetX : event.offsetY;
    const ref: any = this.$refs.outerBar;
    const maxWidth = this.orientation === 'horizontal' ? ref.clientWidth : ref.clientHeight;
    if (this.clickEvent) { this.clickEvent.event(clickPos / maxWidth); }
  }
  private addBarListener() {
    addEventListener('mousemove', this.eventHandler);
  }
  private removeBarListener() {
    removeEventListener('mousemove', this.eventHandler);
  }
}
</script>


<style lang="scss" scoped>
$primary-color: #2c3e50;

h1 {
  color: rgb(243, 243, 234);
}

.outer-bar {
  position: relative;
  cursor: pointer;
  box-shadow: 0 2px 4px 0 rgba(0,0,0,0.16), 0 2px 10px 0 rgba(0,0,0,0.12);
  background-color: white;
  padding: 1px;
}

.inner-bar {
  position: absolute;
  background-color: $primary-color;
  z-index: 1;
}

.inner-bar.horizontal {
  height: 100%;
}

.inner-bar.vertical {
  width: 100%;
  bottom: 0;
}

.overlay {
  position: absolute;
  height: 100%;
  width: 100%;
  z-index: 2;
}

</style>
