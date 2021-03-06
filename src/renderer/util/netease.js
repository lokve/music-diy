import neteaseBase from '@suen/music-api/dist/netease/instance/base';
import instance from '@suen/music-api/dist/util/flyio.web'

function newApi(instance) {
    const getMusicInfo = (info, privilege) => {
        if (!privilege) {
            privilege = info.privilege
        }
        return {
            album: {
                id: info.al.id,
                name: info.al.name,
                cover: info.al.picUrl
            },
            artists: info.ar.map(ar => {
                return {
                    id: ar.id,
                    name: ar.name
                }
            }),
            name: info.name,
            id: info.id,
            cp: !privilege.cp,
            dl: !privilege.fee,
            quality: {
                192: privilege.fl >= 192000,
                320: privilege.fl >= 320000,
                999: privilege.fl >= 999000,
            },
            mv: info.mv
        }
    }

    return {
        async searchSong({keyword, limit = 30, offset = 0, type = 1}) {
            // *(type)* 搜索单曲(1)，歌手(100)，专辑(10)，歌单(1000)，用户(1002)
            const params = {
                csrf_token: '',
                limit,
                type,
                s: keyword,
                offset,
            }
            try {
                let {result} = await instance.post('/weapi/search/get', params)
                if (!result) {
                    result = {
                        playlistCount: 0,
                        playlists: []
                    }
                }
                return {
                    status: true,
                    data: result
                }
            } catch (e) {
                console.warn(e)
                return {
                    status: false,
                    msg: '获取失败',
                    log: e
                }
            }
        },
        async getTopPlaylist(cat = '全部', order = 'hot', page = 1, limit = 50) {
            try {
                const data = await instance.post(`/weapi/playlist/list`, {
                    cat,
                    order,
                    offset: (page - 1) * limit,
                    limit,
                    total: true,
                    csrf_token: ''
                })
                return {
                    status: true,
                    data: data.playlists
                }
            } catch (e) {
                return {
                    status: false,
                    msg: '请求失败',
                    log: e
                }
            }
        },
    }
}

function musicApi(instance) {
    const netease = newApi(neteaseBase(instance))

    return {
        async searchNeteasePlaylist(keyword, offset = 0) {
            if (!keyword) {
                return {
                    status: false,
                    msg: '查询参数不能为空'
                }
            }
            return await netease['searchSong']({keyword, offset, limit: 20, type: 1000})
        },
        async getNeteaseTopPlaylist (cat, order, page, limit) {
            return await netease['getTopPlaylist'](cat, order, page, limit)
        }
    }
}

export default function (adapter) {
    return musicApi(instance(adapter))
}