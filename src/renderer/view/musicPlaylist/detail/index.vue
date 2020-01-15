<template>
    <div :class="s.musicPlaylist" v-loading="loading">
        <div v-if="loading" style="height: 100%;"></div>
        <template v-else>
            <detail-header
                :title="detail.name"
                :cover="detail.cover | image(vendor)"
                play-text="播放全部"
                @play="playAll(songs)"
            >
                <p :class="s.desc">
                    歌单-{{id}}
                    <br />
                    {{escapeToHtml(detail.desc)}}
                </p>
                <ori-btn slot="btns" :songs="songs"></ori-btn>
                <el-dropdown slot="btns" @command="handleCommand">
                    <el-button size="mini" style="margin-left: 10px" type="primary">
                        收藏歌单
                        <i class="el-icon-arrow-down el-icon--right"></i>
                    </el-button>
                    <el-dropdown-menu slot="dropdown">
                        <el-dropdown-item
                            command="line"
                            v-if="userInfo"
                            @click="createListOnline(detail.name)"
                        >在线</el-dropdown-item>
                        <el-dropdown-item command="offline" @click="createList(detail.name)">离线</el-dropdown-item>
                    </el-dropdown-menu>
                </el-dropdown>
            </detail-header>
            <DataTable :data="songs" :class="s.table"></DataTable>
        </template>
    </div>
</template>
<script>
import { mapActions, mapState } from "vuex";
export default {
    data() {
        return {
            detail: {
                cover: "",
                desc: "",
                id: "",
                name: ""
            },
            songs: [],
            loading: false
        };
    },
    computed: {
        ...mapState("offline-playlist", ["offline_playlist"]),
        ...mapState("user", {
            userInfo: "info"
        }),
        id() {
            return this.$route.params.id;
        },
        vendor() {
            return this.$route.query.vendor;
        }
    },
    methods: {
        ...mapActions("play", ["play", "playAll"]),
        async getDetail() {
            this.loading = true;
            const data = await this.$musicApi.getPlaylistDetail(
                this.vendor,
                this.id
            );
            if (data.status) {
                this.detail = data.data.detail;
                this.songs = data.data.songs.map(item => {
                    item.vendor = this.vendor;
                    item.songId = item.id;
                    return item;
                });
                console.log(this.songs);
            } else {
                this.$message.warning(data.msg);
            }
            this.loading = false;
        },
        doPlay() {
            this.play({
                info: this.songs[0],
                playlist: this.songs
            });
        },
        escapeToHtml(str) {
            var temp = document.createElement("div");
            temp.innerHTML = str;
            var output = temp.innerText || temp.textContent;
            temp = null;
            return output;
        },
        handleCommand(command) {
            if (command === "line") {
                this.createListOnline(this.detail.name);
            } else {
                this.createList(this.detail.name);
            }
        },
        async createList(name) {
            if (!name) {
                return;
            }
            if (
                this.offline_playlist.filter(item => item.name === name).length
            ) {
                this.createList(name + 1);
            }
            await this.$store.commit("offline-playlist/add", name);
            this.$store.dispatch("offline-playlist/init");
            const { id } =
                this.offline_playlist.find(item => item.name === name) || {};
            const plistid = `offline_playlist_${id}_song`;
            localStorage.setItem(plistid, JSON.stringify(this.songs));
            this.$message.success("收藏成功");
        },
        async createListOnline(name) {
            if (!name) {
                return;
            }
            const { id } = await this.$store.dispatch("playlist/add", name);
            await Vue.$http.post(`/playlist/${id}/batch2`, {
                collects: this.songs.map(item => {
                    return {
                        ...item,
                        songId: item.id,
                        name: (item.name || "")
                            .replace(/（\s*cover[:：\s][^）]+）/i, "")
                            .replace(/\(\s*cover[:：\s][^\)]+\)/i, ""),
                        keyword:
                            item.name +
                            " - " +
                            item.artists.map(artist => artist.name).join(" / "),
                        cp: false
                    };
                })
            });
            this.$store.dispatch("playlist/init");
            this.$message.success("收藏成功");
        }
    },
    created() {
        this.getDetail();
    }
};
</script>
<style lang="scss" module="s">
.musicPlaylist {
    height: 100%;
    .desc {
        font-size: 12px;
        height: 56px;
        overflow: hidden;
        text-overflow: ellipsis;
        display: -webkit-box;
        -webkit-line-clamp: 5;
        -webkit-box-orient: vertical;
        margin: 12px 0 0;
    }
}
</style>