import { newId } from '../../api.js';
import ImageUpload from '../ImageUpload.jsx';
import ItemControls from '../ItemControls.jsx';
import { moveItem, removeItem, updateItem } from '../listUtils.js';

export default function TeamEditor({ draft, update }) {
  const team = draft.team;
  const setTeam = (next) => update(['team'], next);
  const field = (index, key) => (e) => setTeam(updateItem(team, index, { [key]: e.target.value }));

  return (
    <div className="editor-panel">
      <div className="editor-head">
        <div>
          <h2>Meet the Team</h2>
          <p className="muted">Board members appear in this order on the Meet the Team page. Square photos look best.</p>
        </div>
        <button
          type="button"
          className="btn btn-primary btn-sm"
          onClick={() => setTeam([...team, { id: newId(), name: '', position: '', gradYear: '', major: '', photo: '' }])}
        >
          + Add member
        </button>
      </div>

      {team.length === 0 && <p className="empty-state">No board members yet. Click “Add member” to add one.</p>}

      {team.map((member, index) => (
        <div key={member.id} className="card member-editor">
          <ImageUpload label={member.name || 'Profile photo'} shape="square" value={member.photo} onChange={(url) => setTeam(updateItem(team, index, { photo: url }))} />
          <div className="member-fields">
            <div className="field-row">
              <label className="grow">
                Name
                <input type="text" value={member.name} onChange={field(index, 'name')} />
              </label>
              <label className="grow">
                Position (optional)
                <input type="text" value={member.position} placeholder="e.g. President" onChange={field(index, 'position')} />
              </label>
            </div>
            <div className="field-row">
              <label>
                Graduation year
                <input type="text" inputMode="numeric" maxLength={4} value={member.gradYear} placeholder="2027" onChange={field(index, 'gradYear')} />
              </label>
              <label className="grow">
                Major
                <input type="text" value={member.major} onChange={field(index, 'major')} />
              </label>
            </div>
          </div>
          <ItemControls
            index={index}
            count={team.length}
            onMove={(i, d) => setTeam(moveItem(team, i, d))}
            onRemove={(i) => setTeam(removeItem(team, i))}
            removeLabel="Remove member"
          />
        </div>
      ))}
    </div>
  );
}
