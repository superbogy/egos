import { searchTags } from '@/pages/netdisk/service';
import { TagSchema } from '@/services/schema';
import { PlusOutlined } from '@ant-design/icons';
import { AutoComplete, Input } from 'antd';
import { Tag } from 'antd';
import { useEffect, useState } from 'react';
import { Tag as tagService } from '@/services/tag';
import './tag.less';

export interface TagProps {
  tags: TagSchema[];
  sourceId: number;
  setTags: (ids: number[], tags: string[]) => void;
}

export const TagItem = (props: TagProps) => {
  const { sourceId } = props;
  console.log('tag props', props);
  const [tags, setTags] = useState<any>(props.tags);
  const [inputVisible, setInputVisible] = useState<boolean>(false);
  const [inputValue, setInputValue] = useState('');
  const [tagOptions, setTagOptions] = useState<TagSchema[]>([]);
  useEffect(() => {
    tagService.getTagsBySourceId(sourceId, 'photo').then((res) => {
      setTags(res);
    });

    // return {};
  }, [props.sourceId]);
  let tagSearchTimer: any = null;
  const handleTagSearch = (name: string) => {
    if (tagSearchTimer) {
      clearTimeout(tagSearchTimer);
    }
    tagSearchTimer = setTimeout(() => {
      searchTags(name).then((res) => {
        if (!res.find((i: TagSchema) => i.name === name)) {
          res.push({ name });
        }
        setTagOptions(res);
      });
    }, 100);
  };

  const handleClose = (removedTag: TagSchema) => {
    const newTags = tags
      .filter((tag: TagSchema) => tag.mapId !== removedTag.mapId)
      .map((t: TagSchema) => t.name);
    Promise.resolve(props.setTags([sourceId], newTags))
      .then(() => {
        return tagService.getTagsBySourceId(sourceId, 'photo');
      })
      .then((tags) => setTags(tags));
  };

  const showInput = () => {
    setInputVisible(true);
  };

  const handleInputConfirm = (value: string) => {
    const currentTags = props.tags
      .filter((t) => t.sourceId === sourceId)
      .map((t) => t.name);
    console.log('currentTags', currentTags, props);
    if (value && currentTags.indexOf(value) === -1) {
      // props.setTags([sourceId], [...currentTags, value]);
      Promise.resolve(props.setTags([sourceId], [...currentTags, value]))
        .then(() => {
          return tagService.getTagsBySourceId(sourceId, 'photo');
        })
        .then((tags) => {
          setTags(tags);
          setInputVisible(false);
          setInputValue('');
          setTagOptions([]);
        });
    }
  };

  const forMap = (tag: TagSchema) => {
    const tagElem = (
      <Tag
        closable
        onClose={(e) => {
          e.preventDefault();
          handleClose(tag);
        }}
        color={tag.color || '#999'}
      >
        {tag.name}
      </Tag>
    );
    return (
      <span key={tag.name} style={{ display: 'inline-block' }}>
        {tagElem}
      </span>
    );
  };
  const onChange = (data: string) => {
    setInputValue(data);
  };

  // disable space key scroll window
  const handleKeyDown = (ev: any) => {
    console.log(ev.keyCode);
    if (ev.keyCode === '32') {
      ev.preventDefault();
    }
  };

  return (
    <>
      <div className="tag-box">
        {tags.length || inputVisible ? (
          tags.map(forMap)
        ) : (
          <span className="empty-label">添加标签</span>
        )}
        {inputVisible && (
          <span style={{ marginTop: -3 }}>
            <AutoComplete
              style={{ width: 80, height: 14, border: 'none' }}
              options={tagOptions.map((i) => ({ value: i.name }))}
              onSelect={(value) => handleInputConfirm(value)}
              onSearch={handleTagSearch}
              placeholder="search tags"
              onChange={onChange}
              value={inputValue}
              autoFocus={true}
            >
              <Input
                size="small"
                bordered={false}
                onKeyDown={handleKeyDown}
                // style={{ background: '#fff' }}
              />
            </AutoComplete>
          </span>

          // <Input
          //   ref={inputRef}
          //   type="text"
          //   size="small"
          //   style={{ width: 78 }}
          //   value={inputValue}
          //   onChange={handleInputChange}
          //   onBlur={handleInputConfirm}
          //   onPressEnter={handleInputConfirm}
          // />
        )}
        {!inputVisible && (
          <Tag onClick={showInput} className="site-tag-plus">
            <PlusOutlined />
          </Tag>
        )}
      </div>
    </>
  );
};
