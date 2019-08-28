<template>
  <el-tabs :class="s.playListBox" v-model="isPlayList">
    <el-tab-pane label="网易云" name="a">
      <el-popover width="650" placement="bottom-start" trigger="click">
        <div class="bd">
          <h3>
            <a @click="searchCat('全部')">
              <em>{{cat.all.name}}</em>
            </a>
          </h3>
          <div :class="s.catbox" v-for="(v, k) in cat.categories" :key="k">
            <div :class="s.cattitle">
              {{v}}
            </div>
            <div :class="s.catcont">
              <template v-for="item in cat.sub" v-if="+item.category === +k">
                <a @click="searchCat(item.name)">{{item.name}}</a>
                <span class="line">|</span>
              </template>
            </div>
          </div>
        </div>
        <el-button :class="s.catbtn" size="mini" round slot="reference">{{catname}}</el-button>
      </el-popover>
      <el-button :style="{marginLeft: '15px'}" :class="s.catbtn" size="mini" round @click="searchCat('华语')">华语</el-button>
      <el-button :class="s.catbtn" size="mini" round @click="searchCat('欧美')">欧美</el-button>
      <el-button :class="s.catbtn" size="mini" round @click="searchCat('日语')">日语</el-button>
      <el-button :class="s.catbtn" size="mini" round @click="searchCat('ACG')">ACG</el-button>
      <el-button :class="s.catbtn" size="mini" round @click="searchCat('轻音乐')">轻音乐</el-button>
      <el-radio-group @change="searchCat()" style="float: right" v-model="hot" size="mini">
        <el-radio-button label="hot">热门</el-radio-button>
        <el-radio-button label="new">最新</el-radio-button>
      </el-radio-group>
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
    </el-tab-pane>
    <el-tab-pane label="QQ音乐" name="b">
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
    </el-tab-pane>
  </el-tabs>
</template>
<script>
import { mapActions } from "vuex";
import cat from './cat.js';
export default {
  data() {
    return {
      playList: [],
      qqlist: [],
      loading: false,
      isPlayList: "a",
      image: "https://y.gtimg.cn/mediastyle/global/img/playlist_300.png",
      cat,
      catname: '全部',
      hot: 'hot'
    };
  },
  watch: {
      '$route'() {
          this.getList()
      },
  },
  methods: {
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
    async getList() {
      const {tag, hot} = this.$route.query
      this.catname = tag ? decodeURIComponent(tag) : this.catname;
      this.hot = hot ? decodeURIComponent(hot) : this.hot;
      const data = await this.$musicApi.getNeteaseTopPlaylist(this.catname, this.hot);
      if (data.status) {
        this.playList = data.data;
      }
      // const qdata = await this.$musicApi.qq.getAllTopList();
      // if (data.status) {
      //   this.qqlist = qdata.data;
      // }
    },
    async searchCat(name) {
      this.$router.push({
        path: '/musicPlaylist/hot',
        query: {
          tag: name,
          hot: this.hot,
        }
      })
    },
    escapeToHtml(str) {
      var temp = document.createElement("div");
      temp.innerHTML = str;
      var output = temp.innerText || temp.textContent;
      temp = null;
      return output;
    }
  },
  created() {
    this.getList();
  }
};
</script>
<style lang="scss" module="s">
.playListBox {
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
.catbox {
  margin-bottom: 10px;

  .cattitle {
    margin-bottom: 5px;
  }

  .catcont {
    line-height: 1.5;
    :global {
      .s-fc1, .line {
        margin: 0 2px;
      }
    }
  }
}

.catbtn {
  margin-bottom: 15px;
}
</style>