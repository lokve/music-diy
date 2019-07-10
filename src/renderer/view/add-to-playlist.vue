<template>
  <div :class="s.addToPlaylist">
    <div :class="s.top">
      <el-select
        v-model="chosen.playlist"
        placeholder="请选择歌单"
        size="small"
        style="margin-bottom: 8px;"
      >
        <el-option-group v-if="playlist.length" label="在线歌单">
          <el-option v-for="item in playlist" :key="item.id" :label="item.name" :value="item.id"></el-option>
        </el-option-group>
        <el-option-group v-if="offline_playlist.length" label="离线歌单">
          <el-option
            v-for="item in offline_playlist"
            :key="item.id"
            :label="item.name"
            :value="'offline_playlist_' + item.id + '_song'"
          ></el-option>
        </el-option-group>
      </el-select>
      <el-button size="small" @click="submit" :loading="loading">立即添加</el-button>
    </div>
    <el-table
      :data="songs"
      height="330px"
      style="width: 100%"
      @selection-change="handleSelectionChange"
    >
      <el-table-column type="selection" width="55"></el-table-column>
      <el-table-column prop="name" label="歌曲名" width="160"></el-table-column>
      <el-table-column prop="artists[0].name" label="歌手" width="160"></el-table-column>
      <el-table-column prop="album.name" label="专辑名"></el-table-column>
      <el-table-column label="处理结果">
        <template slot-scope="scope">
          <p
            :class="{ [s.result] : true, [s.success]: scope.row.status }"
            v-if="scope.row.status > -1"
          >{{scope.row.status ? '成功' : `失败: ${scope.row.msg}`}}</p>
        </template>
      </el-table-column>
    </el-table>
    <p :class="s.total">已选择：{{chosen.songs.length}}&nbsp;/&nbsp;{{songs.length}}</p>
  </div>
</template>
<script>
import { mapState, mapActions } from "vuex";
export default {
  data() {
    return {
      songs: [],
      playlist: [],
      chosen: {
        playlist: "",
        songs: []
      },
      loading: false
    };
  },
  computed: {
    ...mapState("offline-playlist", ["offline_playlist"])
  },
  methods: {
    handleSelectionChange(val) {
      this.chosen.songs = val;
    },
    async submit() {
      if (!this.chosen.playlist) {
        this.$message.warning({
          message: "请选择歌单",
          duration: 1000
        });
        return;
      }
      if (!this.chosen.songs.length) {
        this.$message.warning({
          message: "请选择歌曲",
          duration: 1000
        });
        return;
      }
      // this.$message.success(`${this.chosen.playlist}`)
      const uuid = this.chosen.playlist;
      // alert(uuid)
      // alert(uuid.includes("off"))
      // return
      this.loading = true;
      if (uuid.includes("off")) {
        const songs = JSON.parse(localStorage.getItem(uuid)) || [];
        for (const s of this.chosen.songs) {
          if (songs.findIndex(item => item.songId === s.songId) === -1) {
            songs.push(s);
          }
        }
        localStorage.setItem(uuid, JSON.stringify(songs));
        this.$message.success('导入成功')
      } else {
        try {
          const { failedList } = await Vue.$http.post(
            `/playlist/${this.chosen.playlist}/batch2`,
            {
              collects: this.chosen.songs.map(item => {
                return {
                  id: item.id,
                  vendor: item.vendor
                };
              })
            }
          );
          this.chosen.songs = this.chosen.songs.map(song => {
            const cur = failedList.filter(item => song.id === item.id)[0];
            if (cur) {
              song.status = 0;
              song.msg = cur.msg;
            } else {
              song.status = 1;
            }
            return song;
          });
        } catch (e) {}
      }
      this.loading = false;
    }
  },
  created() {
    this.$ipc.on("add-to-playlist-info", (event, { songs, playlist }) => {
      this.songs = songs.map(item => {
        item.id = item.songId;
        item.status = -1;
        return item;
      });
      this.playlist = playlist;
      console.log(playlist);
    });
  }
};
</script>
<style lang="scss" module="s">
.addToPlaylist {
  width: 100%;
  height: 100%;
  position: fixed;
  background: white;
  z-index: 200;
  left: 0;
  top: 0;
  padding: 24px;
  .total {
    margin-right: 8px;
    font-size: 13px;
    color: $color-sub;
    margin-top: 4px;
  }
  .result {
    color: #f56c6c;
    margin: 0;
    &.success {
      color: $color-primary;
    }
  }
}
</style>