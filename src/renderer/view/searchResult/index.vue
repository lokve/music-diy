<template>
    <div :class="s.searchResult">
        <div :class="s.top">
            <a :class="s.title">
                <span>搜索</span>
                <span :class="s.keyword">{{keywords}}</span>
            </a>
        </div>
        <el-tabs v-model="isPlayList">
            <el-tab-pane label="歌曲" name="a">
                <el-tabs type="border-card" @tab-click="venderChange">
                    <el-tab-pane
                        v-model="vName"
                        v-for="vendor of vendors"
                        :key="vendor"
                        :label="vendor"
                    >
                        <DataTable
                            :data="result[vendor] || []"
                            :loading="loading"
                            :showOperate="true"
                            element-loading-text="拼命加载中..."
                        ></DataTable>
                    </el-tab-pane>
                </el-tabs>
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
                                    <img :src="sub.coverImgUrl + '?param=200y200' || image" />
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
                                    <img :src="sub.imgurl || image" />
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
import newApi, { vendors } from "@/util/newApi";
export default {
    data() {
        return {
            activeName: ["1", "2"],
            isPlayList: "a",
            playList: [],
            qqlist: [],
            image: "https://y.gtimg.cn/mediastyle/global/img/playlist_300.png",
            result: {},
            loading: false,
            vendors,
            vName: vendors[0]
        };
    },
    computed: {
        ...mapState("search", ["keywords"])
    },
    watch: {
        keywords() {
            console.log(this.isPlayList);
            if (this.isPlayList === "b") {
                this.searchPlaylist();
            } else {
                this.searchSong();
            }
        },
        isPlayList() {
            if (this.isPlayList === "b") {
                this.searchPlaylist();
            }
        }
    },
    mounted() {
        this.searchSong();
    },
    methods: {
        ...mapActions("play", ["play"]),
        tabClick() {
            this.$router.push({
                path: "/searchResult",
                query: { tab: this.isPlayList }
            });
        },
        venderChange(tab) {
            this.vName = tab.label;
            this.searchSong();
        },
        async searchPlaylist() {
            if (this.isPlayList && this.lastKey !== this.keywords) {
                const data = await this.$musicApi.searchNeteasePlaylist(
                    this.keywords
                );
                if (data.status) {
                    this.playList = data.data.playlists;
                }
                const qdata = await this.$musicApi.searchQQPlaylist(
                    this.keywords
                );
                if (data.status) {
                    this.qqlist = qdata.data.list;
                }
                this.lastKey = this.keywords;
            }
        },
        async searchSong() {
            const info = {
                keyword: this.keywords
            };
            this.loading = true;
            console.log(info);
            let data = await newApi[this.vName].searchList(info);
            if (data) {
                this.result[this.vName] = data.map(item => {
                    return {
                        ...item
                    };
                });
            } else {
                console.warn(data);
                this.$message.warning(data.msg);
            }
            this.loading = false;
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