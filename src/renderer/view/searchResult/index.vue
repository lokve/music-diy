<template>
  <div :class="s.searchResult">
    <div :class="s.top">
      <a :class="s.title">
        <span>搜索</span>
        <span :class="s.keyword">{{keywords}}</span>
      </a>
      <template v-if="isPlayList === 'a'">
        <el-checkbox v-model="filter.netease">网易云</el-checkbox>
        <el-checkbox v-model="filter.qq">QQ音乐</el-checkbox>
        <el-checkbox v-model="filter.xiami">虾米音乐</el-checkbox>
        <el-checkbox v-model="filter.unique">去重</el-checkbox>
        <el-checkbox v-model="filter.cp">包含无版权歌曲</el-checkbox>
      </template>
    </div>
    <el-tabs v-model="isPlayList">
      <el-tab-pane label="歌曲" name="a">
        <DataTable
          :data="result"
          :loading="loading"
          style="padding: 0 12px"
          :pagination="false"
          element-loading-text="拼命加载中...搜索三个平台...还要花时间去重哦~"
        ></DataTable>
      </el-tab-pane>
      <el-tab-pane label="歌单" name="b">
        <div :class="s.listbox">
          <el-collapse v-model="activeName">
            <el-collapse-item title="网易云" name="1">
              <div :class="s.playlist">
                <div
                  :key="sub.id"
                  :class="s.item"
                  v-for="sub in playList"
                  @click="goPlaylist(sub.id, 'netease')"
                >
                  <img :src="sub.coverImgUrl + '?param=200y200' || image">
                  <p>{{sub.name}}</p>
                </div>
              </div>
            </el-collapse-item>
            <el-collapse-item title="QQ音乐" name="2">
              <div :class="s.playlist">
                <div
                  :key="sub.dissid"
                  :class="s.item"
                  v-for="sub in qqlist"
                  @click="goPlaylist(sub.dissid, 'qq')"
                >
                  <img :src="sub.imgurl || image">
                  <p>{{escapeToHtml(sub.dissname)}}</p>
                </div>
              </div>
            </el-collapse-item>
          </el-collapse>
        </div>
      </el-tab-pane>
    </el-tabs>
  </div>
</template>
<script>
import { mapState, mapActions } from "vuex";
import eventBus from "@/eventBus/searchResult";

export default {
  data() {
    return {
      activeName: ['1', '2'],
      filter: {
        cp: true, // 是否包含无版权歌曲
        netease: true,
        xiami: true,
        qq: true,
        unique: true // 是否去重
      },
      isPlayList: "a",
      playList: [],
      qqlist: [],
      image: "https://y.gtimg.cn/mediastyle/global/img/playlist_300.png"
    };
  },
  computed: {
    ...mapState("search", ["keywords", "loading"]),
    result() {
      // 为了避免深拷贝一份数据 此处使用递归filter
      const dealFuncs = [];
      if (this.filter.unique) {
        dealFuncs.push(function(arr) {
          const result = [];
          const resultFeatureList = []; // 特征数组 用于快速判断重复
          for (let i in arr) {
            const cur = arr[i];
            // 检查是否已存在同名 同歌手 同专辑 且能够播放
            const feature = (
              cur.name +
              cur.artists.map(item => item.name).join("") +
              cur.album.name
            ).replace(/\s/g, "");
            const sameIndex = resultFeatureList.indexOf(feature);
            if (sameIndex > -1) {
              // 如果有重复的
              // 如果当前可听，历史不可听 则替换
              if (!cur.cp && resultFeatureList[sameIndex].cp) {
                result.splice(sameIndex, 1, cur);
              }
              continue;
            } else {
              result.push(cur);
              resultFeatureList.push(feature);
            }
          }
          return dealFuncs.length ? dealFuncs.pop()(result) : result;
        });
      }
      if (!this.filter.cp) {
        dealFuncs.push(function(arr) {
          const result = arr.filter(item => !item.cp);
          return dealFuncs.length ? dealFuncs.pop()(result) : result;
        });
      }
      if (!this.filter.netease) {
        dealFuncs.push(function(arr) {
          const result = arr.filter(item => item.vendor !== "netease");
          return dealFuncs.length ? dealFuncs.pop()(result) : result;
        });
      }
      if (!this.filter.qq) {
        dealFuncs.push(function(arr) {
          const result = arr.filter(item => item.vendor !== "qq");
          return dealFuncs.length ? dealFuncs.pop()(result) : result;
        });
      }
      if (!this.filter.xiami) {
        dealFuncs.push(function(arr) {
          const result = arr.filter(item => item.vendor !== "xiami");
          return dealFuncs.length ? dealFuncs.pop()(result) : result;
        });
      }
      return dealFuncs.length
        ? dealFuncs.pop()(eventBus.searchResult)
        : eventBus.searchResult;
    }
  },
  watch: {
    keywords() {
      if (this.isPlayList === "b") {
        this.searchPlaylist();
      }
    },
    isPlayList() {
      if (this.isPlayList === "b") {
        this.searchPlaylist();
      }
    }
  },
  methods: {
    ...mapActions("play", ["play"]),
    async searchPlaylist() {
      if (this.isPlayList && this.lastKey !== this.keywords) {
        const data = await this.$musicApi.searchNeteasePlaylist(this.keywords);
        if (data.status) {
          this.playList = data.data.playlists;
        }
        const qdata = await this.$musicApi.searchQQPlaylist(this.keywords);
        if (data.status) {
          this.qqlist = qdata.data.list;
        }
        this.lastKey = this.keywords;
      }
    },
    goPlaylist(id, vendor) {
      this.$router.push({
        name: "musicPlaylist.detail",
        params: {
          id
        },
        query: {
          vendor
        }
      });
    },
    escapeToHtml(str) {
      var temp = document.createElement("div");
      temp.innerHTML = str;
      var output = temp.innerText || temp.textContent;
      temp = null;
      return output;
    }
  },
  beforeRouteEnter(to, from, next) {
    if (Vue.$store.state.search.keywords.length > 0) {
      next();
    } else {
      Vue.$router.push("/");
    }
  }
};
</script>
<style lang="scss" module="s">
.searchResult {
  :global {
    .el-tabs__header {
      padding: 0 20px;
      margin: 0;
    }
  }
  .top {
    display: flex;
    justify-content: space-between;
    padding: 0 20px;
    margin: 24px 0 5px;
    align-items: flex-end;
    .title {
      display: flex;
      width: 100%;
      font-size: 20px;
      color: #191919;
      align-items: center;
      line-height: 1;
      .keyword {
        color: #fc581f;
      }
    }
    :global {
      .el-checkbox + .el-checkbox {
        margin-left: 12px;
      }
    }
  }

  .listbox {
    padding: 0 20px;
  }
  .playlist {
    display: flex;
    justify-content: space-around;
    flex-wrap: wrap;

    .item {
      width: 135px;
      font-size: 12px;
      cursor: pointer;
      margin-bottom: 10px;
      img {
        width: 135px;
        height: 135px;
      }
    }
  }
}
</style>