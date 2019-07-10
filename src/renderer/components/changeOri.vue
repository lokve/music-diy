<template>
  <el-button plain @click="changeOri">全部换源</el-button>
</template>
<script>
export default {
  props: {
    songs: {
      type: Array,
      default() {
        return [];
      }
    },
    afterChange: {
      type: Function,
      default() {
        return () => {}
      }
    }
  },
  methods: {
    async changeOri() {
      const msg = this.$message({
        duration: 0,
        type: "success",
        message: "换源中，请稍等。。。"
      });
      let status = false;
      for (let index = 0; index < this.songs.length; index++) {
        const tsong = this.songs[index];
        if (tsong.cp) {
          !status && (status = true);
          let data = await this.$musicApi.searchSong(tsong.name);
          if (data.status) {
            const songs = data.data
              .filter(
                item => item.id && !item.cp && item.vendor !== tsong.vendor
              )
              .map(item => {
                return {
                  ...item,
                  songId: item.id
                };
              });
            this.songs.splice(index, 1, songs[0]);
          }
        }
      }
      msg.close();
      this.$message.success(status ? "换源结束" : '不存在失效源');
      status && this.afterChange && this.afterChange();
    }
  }
};
</script>
