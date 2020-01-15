<template>
    <div :class="s.import">
        <el-breadcrumb style="margin-top: 8px;">
            <el-breadcrumb-item :to="{name: 'playlist', params: {id: albumId}}">{{
                name
            }}</el-breadcrumb-item>
            <el-breadcrumb-item>导入歌曲</el-breadcrumb-item>
        </el-breadcrumb>
        <div :class="s.main">
            <el-radio v-for="(item, key) in vendors" :key="key" v-model="vendor" :label="key">
                {{ item.text }}
            </el-radio>
            <el-input
                placeholder="请输入歌单ID"
                v-model="id"
                size="small"
                style="margin-top: 24px;"
                clearable
            >
                <template slot="prepend">
                    <template v-if="vendor === 'netease'">
                        http://music.163.com/#/my/m/music/playlist?id=
                    </template>
                    <template v-else-if="vendor === 'qq'">
                        https://y.qq.com/n/yqq/playlist/
                    </template>
                    <template v-else="vendor === 'xiami'">
                        https://www.xiami.com/collect/
                    </template>
                </template>
                <template slot="append" v-if="vendor === 'qq'">
                    .html
                </template>
            </el-input>
            <p :class="s.help">
                登录网页版<a @click="openExternal(false)">{{ chosen.text }}</a
                >后，<a @click="openExternal">点此进入歌单</a>，从url中找到歌单ID
            </p>
            <el-button
                style="margin-top: 32px"
                size="small"
                type="primary"
                :disabled="!id"
                @click="getAlbumSongs"
                :loading="loading.getAlbumSongs"
                >识别歌单
            </el-button>
            <template v-if="album">
                <el-button
                    style="margin-top: 32px"
                    size="small"
                    type="primary"
                    @click="importSongs"
                    :loading="loading.importSongs"
                    >立即导入
                </el-button>
                <v-table :album="album" style="margin-top: 24px;"></v-table>
            </template>
        </div>
    </div>
</template>
<script>
import {shell} from 'electron';
import vTable from './table.vue';
import {mapState} from 'vuex';

export default {
    components: {
        vTable,
    },
    data() {
        return {
            vendor: 'netease',
            id: '',
            album: null,
            loading: {
                getAlbumSongs: false,
                importSongs: false,
            },
            vendors: {
                netease: {
                    text: '网易云音乐',
                    home: 'http://music.163.com/',
                    album: 'http://music.163.com/#/my/',
                },
                qq: {
                    text: 'QQ音乐',
                    home: 'https://y.qq.com/',
                    album: 'https://y.qq.com/portal/profile.html#sub=other&tab=create&',
                },
                xiami: {
                    text: '虾米音乐',
                    home: 'https://www.xiami.com/',
                    album: 'https://www.xiami.com/space/collect',
                },
            },
        };
    },
    computed: {
        ...mapState('playlist', ['playlist']),
        ...mapState('offline-playlist', ['offline_playlist']),
        albumId() {
            const id = this.$route.params.id;
            return isNaN(Number(id)) ? id : Number(id);
        },
        chosen() {
            return this.vendors[this.vendor];
        },
        offline() {
            return this.$route.query.offline;
        },
        name() {
            const arr = (this.offline ? this.offline_playlist : this.playlist).filter(
                item => item.id === this.albumId,
            );
            return arr.length ? arr[0].name : '';
        },
    },
    watch: {
        vendor() {
            this.album = null;
        },
    },
    methods: {
        openExternal(isAlbum = true) {
            shell.openExternal(isAlbum ? this.chosen.album : this.chosen.home);
        },
        getOfflineStoreName(id = this.albumId) {
            return `offline_playlist_${id}_song`;
        },
        // 获取歌单歌曲
        async getAlbumSongs() {
            this.loading.getAlbumSongs = true;
            try {
                const data = await Vue.$musicApi.getPlaylistDetail(this.vendor, this.id);
                if (data.status) {
                    this.album = {};
                    Vue.set(this.album, 'detail', data.data.detail);
                    Vue.set(this.album, 'songs', data.data.songs);
                    this.album.songs = this.album.songs.map(item => {
                        return {
                            ...item,
                            songId: item.id,
                            vendor: this.vendor,
                            status: -1,
                        };
                    });
                    // this.$message.success('歌单识别成功，正在自动换源');
                    // for (let index = 0; index < this.album.songs.length; index++) {
                    //     const tsong = this.album.songs[index];
                    //     if (tsong.cp) {
                    //         let data = await this.$musicApi.searchSong(tsong.name);
                    //         if (data.status) {
                    //             const songs = data.data
                    //                 .filter(
                    //                     item => item.id && !item.cp && item.vendor !== tsong.vendor,
                    //                 )
                    //                 .map(item => {
                    //                     return {
                    //                         ...item,
                    //                         songId: item.id,
                    //                     };
                    //                 });
                    //             // this.album.songs[index] = songs[0];
                    //             this.album.songs.splice(index, 1, songs[0]);
                    //         }
                    //     }
                    // }
                    // this.$message.success('换源结束');
                } else {
                    this.$message.warning('无法识别歌单');
                }
            } catch (e) {
                console.warn(e);
                e.msg && this.$message.warning(e.msg);
            }
            this.loading.getAlbumSongs = false;
        },
        // 导入歌曲
        async importSongs() {
            this.loading.importSongs = true;
            try {
                if (this.offline) {
                    // TODO
                    localStorage.setItem(
                        this.getOfflineStoreName(),
                        JSON.stringify(this.album.songs),
                    );
                    this.$message.success('导入成功');
                    this.album.songs = [];
                } else {
                    await Vue.$http.post(`/playlist/${this.albumId}/batch2`, {
                        collects: this.album.songs.map(item => {
                            return {
                                ...item,
                                songId: item.id,
                                name: (item.name || '')
                                    .replace(/（\s*cover[:：\s][^）]+）/i, '')
                                    .replace(/\(\s*cover[:：\s][^\)]+\)/i, ''),
                                keyword:
                                    item.name +
                                    ' - ' +
                                    item.artists.map(artist => artist.name).join(' / '),
                                cp: false,
                            };
                        }),
                    });
                    this.$router.push(`/playlist/${this.albumId}`);
                }
            } catch (e) {
                console.warn(e);
                e.msg && this.$message.warning(e.msg);
            }
            this.loading.importSongs = false;
        },
    },
};
</script>
<style lang="scss" module="s">
.import {
    padding: 16px 20px 0;
    .main {
        margin-top: 24px;
    }
    .help {
        color: $color-sub;
        font-size: 12px;
        margin-top: 8px;
        a {
            color: $color-primary;
            cursor: pointer;
        }
    }
}
</style>
