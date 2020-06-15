<template>
    <div>
        <el-popover placement="top" trigger="click" :value="show">
            <p :class="s.title" style="margin-bottom: 10px">单击行将直接更换</p>
            <el-input style="margin-bottom: 10px" size="mini" v-model="info.name">
                <el-button slot="append" icon="el-icon-search" @click="search"></el-button>
            </el-input>
            <el-tabs type="border-card" @tab-click="tabClick">
                <el-tab-pane
                    v-model="vName"
                    v-for="vendor of vendors"
                    :key="vendor"
                    :label="vendor"
                >
                    <DataTable
                        :data="result[vendor] || []"
                        :loading="loading"
                        :showOperate="false"
                        :showListen="true"
                        @rowClick="rowClick"
                        element-loading-text="拼命加载中..."
                        style="max-height: 300px; overflow: auto; width: 600px; padding: 0"
                    ></DataTable>
                </el-tab-pane>
            </el-tabs>

            <span slot="reference" :class="s.replace" @click="show = true">换</span>
        </el-popover>
    </div>
</template>
<script>
import newApi, { vendors } from "@/util/newApi";
export default {
    props: {
        info: {
            type: Object,
            default() {
                return {};
            }
        }
    },
    data() {
        return {
            show: false,
            result: {},
            loading: false,
            vendors,
            vName: vendors[0]
        };
    },
    watch: {
        show(val) {
            if (val) {
                this.search();
            }
        }
    },
    methods: {
        async search() {
            const info = {
                keyword: this.info.name
            };
            this.loading = true;
            let data = await newApi[this.vName].searchList(info);
            if (data) {
                this.result[this.vName] = data.map(item => {
                    return {
                        ...item,
                        songId: this.info.songId,
                        album: {
                            ...this.info.album,
                            ...item.album
                        },
                        vendor: this.info.vendor
                    };
                });
            } else {
                console.warn(data);
                this.$message.warning(data.msg);
            }
            this.loading = false;
        },
        tabClick(tab) {
            this.vName = tab.label;
            this.search();
        },
        rowClick(item) {
            this.show = false;
            this.$emit("replace", item);
        }
    }
};
</script>
<style lang="scss" module="s">
.replace {
    margin-right: -1px;
    line-height: 1;
    font-size: 13px;
    padding: 1px;
    cursor: pointer;
    position: relative;
    top: 1px;
}

.title {
    padding-left: 10px;
    margin: 0;
    color: #303133;
    &::before {
        content: "*";
        font-size: 20px;
        color: #f56c6c;
        position: relative;
        top: 5px;
        margin-right: 2px;
    }
}
</style>